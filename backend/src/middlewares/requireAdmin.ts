import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true, isBanned: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned' });
    }

    if (!user.roles.includes(Role.ADMIN)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
