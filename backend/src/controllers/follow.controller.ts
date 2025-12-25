import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function followCompany(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { companyId } = req.params;

    // Check if company exists
    const company = await prisma.user.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.roles.includes('COMPANY')) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if already following
    const existing = await prisma.userFollowCompany.findUnique({
      where: {
        userId_companyId: {
          userId: req.user.userId,
          companyId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already following this company' });
    }

    const follow = await prisma.userFollowCompany.create({
      data: {
        userId: req.user.userId,
        companyId,
      },
    });

    res.status(201).json({ follow });
  } catch (error) {
    console.error('Follow company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unfollowCompany(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { companyId } = req.params;

    await prisma.userFollowCompany.deleteMany({
      where: {
        userId: req.user.userId,
        companyId,
      },
    });

    res.json({ message: 'Unfollowed company' });
  } catch (error) {
    console.error('Unfollow company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFollowedCompanies(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const follows = await prisma.userFollowCompany.findMany({
      where: { userId: req.user.userId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            companyName: true,
            avatarUrl: true,
            location: true,
            industry: true,
          },
        },
      },
    });

    res.json({ companies: follows.map(f => ({ ...f.user, followedAt: f.createdAt })) });
  } catch (error) {
    console.error('Get followed companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addFollowedRole(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { roleKeyword } = req.body;

    const follow = await prisma.userFollowRole.create({
      data: {
        userId: req.user.userId,
        roleKeyword,
      },
    });

    res.status(201).json({ follow });
  } catch (error) {
    console.error('Add followed role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeFollowedRole(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { roleId } = req.params;

    await prisma.userFollowRole.deleteMany({
      where: {
        id: roleId,
        userId: req.user.userId,
      },
    });

    res.json({ message: 'Role removed' });
  } catch (error) {
    console.error('Remove followed role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFollowedRoles(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const roles = await prisma.userFollowRole.findMany({
      where: { userId: req.user.userId },
    });

    res.json({ roles });
  } catch (error) {
    console.error('Get followed roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
