import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const createRecommendationSchema = z.object({
  recipientId: z.string(),
  relationship: z.string().min(1).max(100),
  position: z.string().max(200).optional(),
  content: z.string().min(10),
});

export async function createRecommendation(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = createRecommendationSchema.parse(req.body);

    // Check if user already gave a recommendation to this person
    const existing = await prisma.recommendation.findUnique({
      where: {
        recipientId_authorId: {
          recipientId: data.recipientId,
          authorId: req.user.userId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already recommended this person' });
    }

    // Create recommendation
    const recommendation = await prisma.recommendation.create({
      data: {
        recipientId: data.recipientId,
        authorId: req.user.userId,
        relationship: data.relationship,
        position: data.position,
        content: data.content,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            companyName: true,
            headline: true,
            roles: true,
          },
        },
      },
    });

    res.status(201).json({ recommendation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserRecommendations(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    const recommendations = await prisma.recommendation.findMany({
      where: {
        recipientId: userId,
        isVisible: true,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            companyName: true,
            headline: true,
            roles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRecommendation(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { recommendationId } = req.params;

    // Check if user owns this recommendation
    const existing = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = createRecommendationSchema.partial().parse(req.body);

    const recommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        relationship: data.relationship,
        position: data.position,
        content: data.content,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            companyName: true,
            headline: true,
            roles: true,
          },
        },
      },
    });

    res.json({ recommendation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteRecommendation(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { recommendationId } = req.params;

    // Check if user owns this recommendation
    const existing = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.recommendation.delete({
      where: { id: recommendationId },
    });

    res.json({ message: 'Recommendation deleted' });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function toggleRecommendationVisibility(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { recommendationId } = req.params;

    // Check if user is the recipient (can hide/show recommendations they received)
    const existing = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!existing || existing.recipientId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const recommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { isVisible: !existing.isVisible },
    });

    res.json({ recommendation });
  } catch (error) {
    console.error('Toggle recommendation visibility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
