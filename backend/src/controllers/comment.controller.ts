import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function createComment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { postId } = req.params;
    const data = createCommentSchema.parse(req.body);

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: req.user.userId,
        content: data.content,
      },
    });

    // Fetch the comment with author info to return
    const commentWithAuthor = await prisma.postComment.findUnique({
      where: { id: comment.id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            headline: true,
          },
        },
      },
    });

    res.status(201).json({ comment: commentWithAuthor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPostComments(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const comments = await prisma.postComment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            headline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { commentId } = req.params;

    // Check if user owns this comment
    const existing = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.postComment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
