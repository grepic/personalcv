import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { Role } from '@prisma/client';

const onboardingSchema = z.object({
  roles: z.array(z.enum([Role.CANDIDATE, Role.FREELANCER, Role.COMPANY])),
  isLookingForJob: z.boolean(),
  isOfferingFreelance: z.boolean(),
  headline: z.string().optional(),
  location: z.string().optional(),
  companyName: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
});

const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  templateId: z.string().optional(),
  avatarUrl: z.string().optional(),
  isLookingForJob: z.boolean().optional(),
  isOfferingFreelance: z.boolean().optional(),
  companyName: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  websiteUrl: z.string().optional(),
  about: z.string().optional(),
});

export async function onboarding(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = onboardingSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        roles: data.roles,
        isLookingForJob: data.isLookingForJob,
        isOfferingFreelance: data.isOfferingFreelance,
        headline: data.headline,
        location: data.location,
        companyName: data.companyName,
        companySize: data.companySize as any,
        industry: data.industry,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        headline: true,
        roles: true,
        isLookingForJob: true,
        isOfferingFreelance: true,
      },
    });

    // Create user preferences
    await prisma.userPreferences.upsert({
      where: { userId: req.user.userId },
      create: { userId: req.user.userId },
      update: {},
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        languages: true,
        education: { orderBy: { startDate: 'desc' } },
        experience: { orderBy: { startDate: 'desc' } },
        certifications: { orderBy: { date: 'desc' } },
        portfolioProjects: { orderBy: { createdAt: 'desc' } },
        services: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't expose password hash
    const { passwordHash, ...userProfile } = user;

    res.json({ user: userProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
    });

    const { passwordHash, ...userProfile } = user;

    res.json({ user: userProfile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Skills
export async function addSkill(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name } = req.body;

    const skill = await prisma.userSkill.create({
      data: {
        userId: req.user.userId,
        name,
      },
    });

    res.status(201).json({ skill });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeSkill(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { skillId } = req.params;

    await prisma.userSkill.delete({
      where: {
        id: skillId,
        userId: req.user.userId,
      },
    });

    res.json({ message: 'Skill removed' });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Experience
export async function addExperience(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const experience = await prisma.experience.create({
      data: {
        userId: req.user.userId,
        ...req.body,
      },
    });

    res.status(201).json({ experience });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateExperience(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { experienceId } = req.params;

    const experience = await prisma.experience.updateMany({
      where: {
        id: experienceId,
        userId: req.user.userId,
      },
      data: req.body,
    });

    res.json({ experience });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteExperience(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { experienceId } = req.params;

    await prisma.experience.deleteMany({
      where: {
        id: experienceId,
        userId: req.user.userId,
      },
    });

    res.json({ message: 'Experience deleted' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Search users
export async function searchUsers(req: AuthRequest, res: Response) {
  try {
    const {
      q,
      role,
      location,
      isLookingForJob,
      isOfferingFreelance,
      skill,
      limit = '20',
      offset = '0',
    } = req.query;

    const where: any = {};

    if (q) {
      where.OR = [
        { displayName: { contains: q as string, mode: 'insensitive' } },
        { headline: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.roles = { has: role as Role };
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (isLookingForJob !== undefined) {
      where.isLookingForJob = isLookingForJob === 'true';
    }

    if (isOfferingFreelance !== undefined) {
      where.isOfferingFreelance = isOfferingFreelance === 'true';
    }

    if (skill) {
      where.skills = {
        some: {
          name: { contains: skill as string, mode: 'insensitive' },
        },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        headline: true,
        avatarUrl: true,
        location: true,
        roles: true,
        skills: { take: 5 },
        portfolioProjects: { take: 1 },
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({ where });

    res.json({ users, total });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
