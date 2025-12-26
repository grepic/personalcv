import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const createReactionSchema = z.object({
  type: z.enum(['like', 'love', 'celebrate', 'insightful', 'curious']).optional().default('like'),
});

export async function toggleReaction(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { postId } = req.params;
    const data = createReactionSchema.parse(req.body);

    // Check if reaction already exists
    const existing = await prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.user.userId,
        },
      },
    });

    if (existing) {
      // If same type, remove it (unlike)
      if (existing.type === data.type) {
        await prisma.postReaction.delete({
          where: { id: existing.id },
        });
        return res.json({ message: 'Reaction removed', reacted: false });
      }

      // Otherwise, update to new type
      const reaction = await prisma.postReaction.update({
        where: { id: existing.id },
        data: { type: data.type },
      });
      return res.json({ reaction, reacted: true });
    }

    // Create new reaction
    const reaction = await prisma.postReaction.create({
      data: {
        postId,
        userId: req.user.userId,
        type: data.type,
      },
    });

    res.status(201).json({ reaction, reacted: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Toggle reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPostReactions(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;

    const reactions = await prisma.postReaction.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    // Group by type
    const grouped: Record<string, number> = {};
    reactions.forEach(r => {
      grouped[r.type] = (grouped[r.type] || 0) + 1;
    });

    // Check if current user has reacted
    let userReaction = null;
    if (req.user) {
      userReaction = reactions.find(r => r.userId === req.user!.userId);
    }

    res.json({
      total: reactions.length,
      byType: grouped,
      userReaction: userReaction?.type || null,
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
