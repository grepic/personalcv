import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { ApplicationStatus, Role } from '@prisma/client';

export async function applyToJob(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { jobId } = req.params;

    // Check if user is a candidate or freelancer
    if (!req.user.roles.includes(Role.CANDIDATE) && !req.user.roles.includes(Role.FREELANCER)) {
      return res.status(403).json({ error: 'Only candidates and freelancers can apply to jobs' });
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: 'Job is not open for applications' });
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId: req.user.userId,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: req.user.userId,
        companyId: job.companyId,
        status: ApplicationStatus.NEW,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        candidate: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create notification for company
    await prisma.notification.create({
      data: {
        userId: job.companyId,
        type: 'APPLICATION_UPDATE',
        data: {
          applicationId: application.id,
          candidateId: req.user.userId,
          jobId,
          status: 'NEW',
        },
      },
    });

    res.status(201).json({ application });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getJobApplications(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { jobId } = req.params;

    // Check if user is the job owner
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.companyId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            location: true,
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { applicationId } = req.params;
    const { status } = req.body;

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if user is the company owner
    if (application.job.companyId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update status
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    // Notify candidate
    await prisma.notification.create({
      data: {
        userId: application.candidateId,
        type: 'APPLICATION_UPDATE',
        data: {
          applicationId,
          jobId: application.jobId,
          status,
        },
      },
    });

    res.json({ application: updated });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyApplications(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const applications = await prisma.application.findMany({
      where: { candidateId: req.user.userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            isRemote: true,
            employmentType: true,
            status: true,
            company: {
              select: {
                id: true,
                displayName: true,
                companyName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
