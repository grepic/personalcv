import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ReportType, ReportStatus } from '@prisma/client';

interface AuthRequest extends Request {
  userId?: string;
}

// Validation schemas
const createReportSchema = z.object({
  reportedUserId: z.string().optional(),
  reportedJobId: z.string().optional(),
  reportedPostId: z.string().optional(),
  type: z.nativeEnum(ReportType),
  reason: z.string().min(10).max(500),
  description: z.string().max(2000).optional(),
  evidence: z.array(z.string().url()).max(5).optional(),
}).refine(
  (data) => data.reportedUserId || data.reportedJobId || data.reportedPostId,
  { message: 'At least one reported entity must be specified' }
);

/**
 * Create a new report
 */
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validation = createReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const data = validation.data;

    // Check if already reported
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: userId,
        reportedUserId: data.reportedUserId,
        reportedJobId: data.reportedJobId,
        reportedPostId: data.reportedPostId,
        status: {
          in: [ReportStatus.PENDING, ReportStatus.REVIEWING],
        },
      },
    });

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this item' });
    }

    // Prevent self-reporting
    if (data.reportedUserId === userId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportedUserId: data.reportedUserId,
        reportedJobId: data.reportedJobId,
        reportedPostId: data.reportedPostId,
        type: data.type,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence || [],
      },
      include: {
        reporter: {
          select: {
            displayName: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

/**
 * Get user's reports
 */
export const getUserReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const reports = await prisma.report.findMany({
      where: { reporterId: userId },
      include: {
        reportedUser: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Error getting user reports:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

/**
 * Admin: Get all reports
 */
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ReportStatus | undefined;
    const type = req.query.type as ReportType | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

/**
 * Admin: Get report details
 */
export const getReportDetails = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            isBanned: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error getting report details:', error);
    res.status(500).json({ error: 'Failed to get report details' });
  }
};

/**
 * Admin: Update report status
 */
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status, reviewNotes, resolution } = req.body;
    const adminId = req.userId;

    if (!Object.values(ReportStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        resolution: resolution || null,
      },
      include: {
        reporter: {
          select: {
            displayName: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.json(report);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};

/**
 * Admin: Get report statistics
 */
export const getReportStats = async (req: Request, res: Response) => {
  try {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByType,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
      prisma.report.count({ where: { status: ReportStatus.DISMISSED } }),
      prisma.report.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    res.json({
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByType,
    });
  } catch (error) {
    console.error('Error getting report stats:', error);
    res.status(500).json({ error: 'Failed to get report stats' });
  }
};
