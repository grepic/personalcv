import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function toggleSaveJob(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { jobId } = req.params;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: req.user.userId,
          jobId,
        },
      },
    });

    if (existing) {
      // Unsave the job
      await prisma.savedJob.delete({
        where: { id: existing.id },
      });
      return res.json({ message: 'Job unsaved', saved: false });
    }

    // Save the job
    const savedJob = await prisma.savedJob.create({
      data: {
        userId: req.user.userId,
        jobId,
      },
    });

    res.status(201).json({ savedJob, saved: true });
  } catch (error) {
    console.error('Toggle save job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSavedJobs(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit = '20', offset = '0' } = req.query;

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: req.user.userId },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                displayName: true,
                companyName: true,
                avatarUrl: true,
                location: true,
              },
            },
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ savedJobs });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function checkJobSaved(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.json({ saved: false });
    }

    const { jobId } = req.params;

    const savedJob = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: req.user.userId,
          jobId,
        },
      },
    });

    res.json({ saved: !!savedJob });
  } catch (error) {
    console.error('Check job saved error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
