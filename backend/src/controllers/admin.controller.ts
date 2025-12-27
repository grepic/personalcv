import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Check if user has admin email or admin role
    // You can customize this logic based on your needs
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(user?.email || '');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalPosts,
      totalApplications,
      activeUsers,
      newUsersToday,
      newJobsToday,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.post.count(),
      prisma.application.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.job.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.job.aggregate({
        _sum: {
          paymentAmount: true,
        },
        where: {
          isPaid: true,
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalJobs,
      totalPosts,
      totalApplications,
      activeUsers,
      newUsersToday,
      newJobsToday,
      revenue: revenue._sum.paymentAmount || 0,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

/**
 * Get all users with pagination
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const where = search
      ? {
          OR: [
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          roles: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: true,
              jobsPosted: true,
              applications: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

/**
 * Get user details
 */
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        jobsPosted: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        applications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        skills: true,
        experience: true,
        education: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
};

/**
 * Ban user
 */
export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true, isBanned: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent banning other admins
    if (user.roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }

    if (user.isBanned) {
      return res.status(400).json({ error: 'User is already banned' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: adminId,
        banReason: reason || 'No reason provided',
      },
    });

    // TODO: Invalidate all user's refresh tokens

    res.json({ message: 'User banned successfully', userId, reason });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

/**
 * Unban user
 */
export const unbanUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isBanned) {
      return res.status(400).json({ error: 'User is not banned' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedBy: null,
        banReason: null,
      },
    });

    res.json({ message: 'User unbanned successfully', userId });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Get all jobs
 */
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        include: {
          company: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count(),
    ]);

    res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
};

/**
 * Approve job
 */
export const approveJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // TODO: Add approved field to schema if needed

    res.json({ message: 'Job approved successfully', jobId });
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({ error: 'Failed to approve job' });
  }
};

/**
 * Reject job
 */
export const rejectJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    // TODO: Add rejection logic

    res.json({ message: 'Job rejected successfully', jobId, reason });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ error: 'Failed to reject job' });
  }
};

/**
 * Delete job
 */
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    await prisma.job.delete({
      where: { id: jobId },
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

/**
 * Get all posts
 */
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count(),
    ]);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
};

/**
 * Delete post
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

/**
 * Get reports (mock - you'd need to implement reporting system)
 */
export const getReports = async (req: Request, res: Response) => {
  try {
    // TODO: Implement reporting system in schema
    res.json({ reports: [], message: 'Reporting system not yet implemented' });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

/**
 * Resolve report
 */
export const resolveReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    // TODO: Implement report resolution

    res.json({ message: 'Report resolved successfully', reportId });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};

/**
 * Get user analytics
 */
export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: true,
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    res.json({ userGrowth });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
};

/**
 * Get job analytics
 */
export const getJobAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [jobsByType, jobsByStatus, topLocations] = await Promise.all([
      prisma.job.groupBy({
        by: ['employmentType'],
        _count: true,
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.job.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.job.groupBy({
        by: ['location'],
        _count: true,
        orderBy: {
          _count: {
            location: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    res.json({
      jobsByType,
      jobsByStatus,
      topLocations,
    });
  } catch (error) {
    console.error('Error getting job analytics:', error);
    res.status(500).json({ error: 'Failed to get job analytics' });
  }
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalRevenue, revenueByTier, recentPayments] = await Promise.all([
      prisma.job.aggregate({
        _sum: {
          paymentAmount: true,
        },
        _count: true,
        where: {
          isPaid: true,
          paidAt: {
            gte: startDate,
          },
        },
      }),
      prisma.job.groupBy({
        by: ['pricingTier'],
        _sum: {
          paymentAmount: true,
        },
        _count: true,
        where: {
          isPaid: true,
        },
      }),
      prisma.job.findMany({
        where: {
          isPaid: true,
          paidAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          title: true,
          pricingTier: true,
          paymentAmount: true,
          paidAt: true,
          company: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: {
          paidAt: 'desc',
        },
        take: 20,
      }),
    ]);

    res.json({
      totalRevenue: totalRevenue._sum.paymentAmount || 0,
      totalPaidJobs: totalRevenue._count,
      revenueByTier,
      recentPayments,
    });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
};