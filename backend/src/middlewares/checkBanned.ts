import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
}

export const checkBanned = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next(); // Not authenticated, skip ban check
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, banReason: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({
        error: 'Your account has been banned',
        reason: user.banReason || 'No reason provided',
        message: 'Please contact support if you believe this is a mistake',
      });
    }

    next();
  } catch (error) {
    console.error('Ban check error:', error);
    next(); // On error, allow request to continue (fail open)
  }
};
