import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { Role, Recommendation } from '@prisma/client';

const createReviewSchema = z.object({
  jobId: z.string().optional(),
  round: z.number().int().positive(),
  title: z.string(),
  hardSkills: z.number().int().min(1).max(5).optional(),
  softSkills: z.number().int().min(1).max(5).optional(),
  language: z.number().int().min(1).max(5).optional(),
  cultureFit: z.number().int().min(1).max(5).optional(),
  overallRecommendation: z.enum([
    Recommendation.STRONG_HIRE,
    Recommendation.HIRE,
    Recommendation.NEUTRAL,
    Recommendation.NO_HIRE,
  ]),
  summary: z.string(),
});

export async function createCandidateReview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user is a company
    if (!req.user.roles.includes(Role.COMPANY)) {
      return res.status(403).json({ error: 'Only companies can create reviews' });
    }

    const { candidateId } = req.params;
    const data = createReviewSchema.parse(req.body);

    // Get current user's company ID
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyName: true },
    });

    const review = await prisma.candidateReview.create({
      data: {
        candidateId,
        companyId: req.user.userId,
        authorId: req.user.userId,
        jobId: data.jobId,
        round: data.round,
        title: data.title,
        hardSkills: data.hardSkills,
        softSkills: data.softSkills,
        language: data.language,
        cultureFit: data.cultureFit,
        overallRecommendation: data.overallRecommendation,
        summary: data.summary,
      },
    });

    res.status(201).json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create candidate review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCandidateReviews(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { candidateId } = req.params;
    const { companyId, jobId } = req.query;

    // Check if user is part of the company requesting reviews
    if (companyId && companyId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const where: any = {
      candidateId,
      companyId: companyId || req.user.userId,
    };

    if (jobId) {
      where.jobId = jobId as string;
    }

    const reviews = await prisma.candidateReview.findMany({
      where,
      orderBy: [
        { round: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get candidate reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCandidateReview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { reviewId } = req.params;

    // Check if user is the author
    const existing = await prisma.candidateReview.findUnique({
      where: { id: reviewId },
    });

    if (!existing || existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const review = await prisma.candidateReview.update({
      where: { id: reviewId },
      data: req.body,
    });

    res.json({ review });
  } catch (error) {
    console.error('Update candidate review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
