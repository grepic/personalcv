import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { EmploymentType, JobStatus, PostType, Role } from '@prisma/client';

const createJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  employmentType: z.enum([
    EmploymentType.FULL_TIME,
    EmploymentType.PART_TIME,
    EmploymentType.CONTRACT,
    EmploymentType.INTERNSHIP,
    EmploymentType.FREELANCE,
  ]),
  location: z.string(),
  isRemote: z.boolean(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  currency: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export async function createJob(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user is a company
    if (!req.user.roles.includes(Role.COMPANY)) {
      return res.status(403).json({ error: 'Only companies can post jobs' });
    }

    const data = createJobSchema.parse(req.body);

    // Create job
    const job = await prisma.job.create({
      data: {
        companyId: req.user.userId,
        title: data.title,
        description: data.description,
        employmentType: data.employmentType,
        location: data.location,
        isRemote: data.isRemote,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        skills: {
          create: (data.skills || []).map(name => ({ name })),
        },
      },
      include: {
        skills: true,
        company: {
          select: {
            id: true,
            displayName: true,
            companyName: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
    });

    // Create a post for this job
    const post = await prisma.post.create({
      data: {
        authorId: req.user.userId,
        type: PostType.JOB,
        title: job.title,
        content: job.description,
        mediaUrls: [],
        tags: data.skills || [],
        visibility: 'public',
        jobId: job.id,
      },
    });

    // Notify followers and users with matching skills/roles
    await notifyJobPosted(job);

    res.status(201).json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function notifyJobPosted(job: any) {
  try {
    // Find users who follow this company
    const followers = await prisma.userFollowCompany.findMany({
      where: {
        companyId: job.companyId,
      },
      include: {
        user: {
          include: {
            preferences: true,
          },
        },
      },
    });

    // Find users with matching skills
    const jobSkills = await prisma.jobSkill.findMany({
      where: { jobId: job.id },
      select: { name: true },
    });

    const skillNames = jobSkills.map(s => s.name);

    const usersWithMatchingSkills = await prisma.user.findMany({
      where: {
        skills: {
          some: {
            name: { in: skillNames },
          },
        },
        isLookingForJob: true,
      },
      include: {
        preferences: true,
      },
    });

    // Create notifications
    const notificationsToCreate = [];

    for (const follower of followers) {
      if (follower.user.preferences?.notifyJobsFromFollowedCompanies) {
        notificationsToCreate.push({
          userId: follower.userId,
          type: 'JOB_POSTED' as const,
          data: {
            jobId: job.id,
            companyId: job.companyId,
            jobTitle: job.title,
          },
        });
      }
    }

    for (const user of usersWithMatchingSkills) {
      if (user.preferences?.notifyJobsMatchingSkills) {
        // Don't duplicate if they're already a follower
        const alreadyNotified = notificationsToCreate.some(n => n.userId === user.id);
        if (!alreadyNotified) {
          notificationsToCreate.push({
            userId: user.id,
            type: 'JOB_POSTED' as const,
            data: {
              jobId: job.id,
              companyId: job.companyId,
              jobTitle: job.title,
            },
          });
        }
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }
  } catch (error) {
    console.error('Notify job posted error:', error);
  }
}

export async function getJobs(req: AuthRequest, res: Response) {
  try {
    const {
      q,
      location,
      remote,
      employmentType,
      minSalary,
      maxSalary,
      skill,
      status = 'OPEN',
      limit = '20',
      offset = '0',
    } = req.query;

    const where: any = {
      status: status as JobStatus,
    };

    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (remote !== undefined) {
      where.isRemote = remote === 'true';
    }

    if (employmentType) {
      where.employmentType = employmentType as EmploymentType;
    }

    if (minSalary) {
      where.salaryMin = { gte: parseFloat(minSalary as string) };
    }

    if (maxSalary) {
      where.salaryMax = { lte: parseFloat(maxSalary as string) };
    }

    if (skill) {
      where.skills = {
        some: {
          name: { contains: skill as string, mode: 'insensitive' },
        },
      };
    }

    const jobs = await prisma.job.findMany({
      where,
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
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.job.count({ where });

    res.json({ jobs, total });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getJob(req: AuthRequest, res: Response) {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            displayName: true,
            companyName: true,
            avatarUrl: true,
            location: true,
            about: true,
            websiteUrl: true,
          },
        },
        skills: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateJob(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { jobId } = req.params;

    // Check ownership
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob || existingJob.companyId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: req.body,
      include: {
        skills: true,
        company: true,
      },
    });

    res.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateJobStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { jobId } = req.params;
    const { status } = req.body;

    // Check ownership
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob || existingJob.companyId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });

    res.json({ job });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
