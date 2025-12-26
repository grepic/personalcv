import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { PostType } from '@prisma/client';

const createPostSchema = z.object({
  type: z.enum([PostType.STATUS, PostType.PORTFOLIO]),
  title: z.string().optional(),
  content: z.string(),
  mediaUrls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'followers_only']).optional(),
});

export async function getFeed(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { type, limit = '20', offset = '0' } = req.query;

    const where: any = {};

    if (type) {
      where.type = type as PostType;
    }

    // Get posts from:
    // 1. Users the current user follows (companies)
    // 2. Public posts
    // 3. Current user's own posts
    const followedCompanies = await prisma.userFollowCompany.findMany({
      where: { userId: req.user.userId },
      select: { companyId: true },
    });

    const followedCompanyIds = followedCompanies.map(fc => fc.companyId);

    where.OR = [
      { authorId: { in: followedCompanyIds } },
      { visibility: 'public' },
      { authorId: req.user.userId },
    ];

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            roles: true,
            companyName: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            isRemote: true,
            employmentType: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ posts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createPost(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = createPostSchema.parse(req.body);

    const post = await prisma.post.create({
      data: {
        authorId: req.user.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        mediaUrls: data.mediaUrls || [],
        tags: data.tags || [],
        visibility: data.visibility || 'public',
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            roles: true,
          },
        },
      },
    });

    res.status(201).json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPost(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            roles: true,
            companyName: true,
          },
        },
        job: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePost(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { postId } = req.params;

    // Check if user owns this post
    const existing = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = createPostSchema.partial().parse(req.body);

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        content: data.content,
        mediaUrls: data.mediaUrls,
        tags: data.tags,
        visibility: data.visibility,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            roles: true,
          },
        },
      },
    });

    res.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePost(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { postId } = req.params;

    // Check if user owns this post
    const existing = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
