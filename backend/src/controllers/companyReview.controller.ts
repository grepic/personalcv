import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100),
  content: z.string().min(10),
  pros: z.string().optional(),
  cons: z.string().optional(),
  isVerifiedEmployee: z.boolean().optional(),
});

export async function createCompanyReview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { companyId } = req.params;
    const data = createReviewSchema.parse(req.body);

    // Check if company exists and is actually a company
    const company = await prisma.user.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.roles.includes('COMPANY')) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if user already reviewed this company
    const existing = await prisma.companyReview.findUnique({
      where: {
        companyId_authorId: {
          companyId,
          authorId: req.user.userId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this company' });
    }

    const review = await prisma.companyReview.create({
      data: {
        companyId,
        authorId: req.user.userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        pros: data.pros,
        cons: data.cons,
        isVerifiedEmployee: data.isVerifiedEmployee || false,
      },
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

    res.status(201).json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create company review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCompanyReviews(req: AuthRequest, res: Response) {
  try {
    const { companyId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const reviews = await prisma.companyReview.findMany({
      where: { companyId },
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

    const stats = await prisma.companyReview.groupBy({
      by: ['companyId'],
      where: { companyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = stats[0]?._avg.rating || 0;
    const totalReviews = stats[0]?._count.rating || 0;

    // Get rating distribution
    const distribution = await prisma.companyReview.groupBy({
      by: ['rating'],
      where: { companyId },
      _count: { rating: true },
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    distribution.forEach((item) => {
      ratingDistribution[item.rating as 1 | 2 | 3 | 4 | 5] = item._count.rating;
    });

    res.json({
      reviews,
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Get company reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCompanyReview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { reviewId } = req.params;

    // Check if user is the author
    const existing = await prisma.companyReview.findUnique({
      where: { id: reviewId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = createReviewSchema.parse(req.body);

    const review = await prisma.companyReview.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        title: data.title,
        content: data.content,
        pros: data.pros,
        cons: data.cons,
        isVerifiedEmployee: data.isVerifiedEmployee,
      },
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

    res.json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update company review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCompanyReview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { reviewId } = req.params;

    // Check if user is the author
    const existing = await prisma.companyReview.findUnique({
      where: { id: reviewId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.companyReview.delete({
      where: { id: reviewId },
    });

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete company review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
