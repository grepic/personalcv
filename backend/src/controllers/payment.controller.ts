import { Request, Response } from 'express';
import { PrismaClient, JobPricingTier, CompanySubscriptionPlan } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Pricing configuration (in CZK)
const JOB_PRICING = {
  FREE: { price: 0, duration: 7 },
  STANDARD: { price: 4990, duration: 30 },
  FEATURED: { price: 9990, duration: 30 },
  PREMIUM: { price: 14990, duration: 60 },
};

const SUBSCRIPTION_PRICING = {
  FREE: { price: 0, jobLimit: 1, cvViewLimit: 5 },
  PROFESSIONAL: { price: 7990, jobLimit: 5, cvViewLimit: 20 },
  ENTERPRISE: { price: 24990, jobLimit: -1, cvViewLimit: -1 }, // -1 = unlimited
};

// Validation schemas
const createJobPaymentSchema = z.object({
  jobId: z.string().min(1),
  tier: z.enum(['STANDARD', 'FEATURED', 'PREMIUM']),
  paymentMethod: z.string().optional(), // e.g., 'card', 'bank_transfer'
});

const createSubscriptionSchema = z.object({
  plan: z.enum(['PROFESSIONAL', 'ENTERPRISE']),
  paymentMethod: z.string().optional(),
});

/**
 * Create payment for job posting
 * Note: This is a simplified implementation. In production, integrate with
 * payment providers like Stripe, PayPal, or Czech-specific providers like GoPay
 */
export const createJobPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validation = createJobPaymentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { jobId, tier, paymentMethod } = validation.data;

    // Verify job exists and belongs to user
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.companyId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get pricing
    const pricing = JOB_PRICING[tier];

    // In production, create payment intent with payment provider
    // For now, we'll simulate successful payment
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pricing.duration);

    // Update job with payment info
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        pricingTier: tier,
        isPaid: true,
        paidAt: new Date(),
        paymentAmount: pricing.price,
        expiresAt,
      },
    });

    res.json({
      message: 'Payment successful',
      paymentId,
      job: updatedJob,
      amount: pricing.price,
      expiresAt,
    });
  } catch (error) {
    console.error('Error creating job payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

/**
 * Verify payment status
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    // In production, verify with payment provider
    // For now, simulate verification

    res.json({
      paymentId,
      status: 'completed',
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

/**
 * Create company subscription
 */
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validation = createSubscriptionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { plan, paymentMethod } = validation.data;

    // Verify user is a company
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.roles.includes('COMPANY')) {
      return res.status(403).json({ error: 'Only companies can subscribe' });
    }

    // Get pricing
    const pricing = SUBSCRIPTION_PRICING[plan];

    // In production, create subscription with payment provider (recurring payment)
    // For now, simulate successful subscription
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      message: 'Subscription created successfully',
      subscriptionId,
      plan,
      amount: pricing.price,
      jobLimit: pricing.jobLimit,
      cvViewLimit: pricing.cvViewLimit,
      billingCycle: 'monthly',
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // In production, cancel subscription with payment provider
    // Update user's subscription status in database

    res.json({
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get all paid jobs for this company
    const paidJobs = await prisma.job.findMany({
      where: {
        companyId: userId,
        isPaid: true,
      },
      select: {
        id: true,
        title: true,
        pricingTier: true,
        paymentAmount: true,
        paidAt: true,
        expiresAt: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    res.json({
      payments: paidJobs,
      totalSpent: paidJobs.reduce((sum, job) => sum + (job.paymentAmount || 0), 0),
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
};
