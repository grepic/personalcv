import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  mediaUrls: z.array(z.string().url()).optional(),
  externalUrl: z.string().url().optional(),
});

export async function createPortfolioProject(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = createProjectSchema.parse(req.body);

    const project = await prisma.portfolioProject.create({
      data: {
        userId: req.user.userId,
        title: data.title,
        description: data.description,
        mediaUrls: data.mediaUrls || [],
        externalUrl: data.externalUrl,
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create portfolio project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserPortfolioProjects(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    const projects = await prisma.portfolioProject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get portfolio projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePortfolioProject(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { projectId } = req.params;

    // Check if user owns this project
    const existing = await prisma.portfolioProject.findUnique({
      where: { id: projectId },
    });

    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = createProjectSchema.parse(req.body);

    const project = await prisma.portfolioProject.update({
      where: { id: projectId },
      data: {
        title: data.title,
        description: data.description,
        mediaUrls: data.mediaUrls || [],
        externalUrl: data.externalUrl,
      },
    });

    res.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update portfolio project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePortfolioProject(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { projectId } = req.params;

    // Check if user owns this project
    const existing = await prisma.portfolioProject.findUnique({
      where: { id: projectId },
    });

    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.portfolioProject.delete({
      where: { id: projectId },
    });

    res.json({ message: 'Portfolio project deleted' });
  } catch (error) {
    console.error('Delete portfolio project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
