import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().default('USD'),
  deliveryTime: z.string().min(1),
});

export async function createFreelancerService(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = createServiceSchema.parse(req.body);

    const service = await prisma.freelancerService.create({
      data: {
        userId: req.user.userId,
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        deliveryTime: data.deliveryTime,
      },
    });

    res.status(201).json({ service });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserFreelancerServices(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    const services = await prisma.freelancerService.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFreelancerService(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { serviceId } = req.params;

    // Check if user owns this service
    const existing = await prisma.freelancerService.findUnique({
      where: { id: serviceId },
    });

    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = createServiceSchema.parse(req.body);

    const service = await prisma.freelancerService.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        deliveryTime: data.deliveryTime,
      },
    });

    res.json({ service });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFreelancerService(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { serviceId } = req.params;

    // Check if user owns this service
    const existing = await prisma.freelancerService.findUnique({
      where: { id: serviceId },
    });

    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.freelancerService.delete({
      where: { id: serviceId },
    });

    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
