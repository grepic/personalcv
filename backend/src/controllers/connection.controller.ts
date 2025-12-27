import { Request, Response } from 'express';
import { PrismaClient, ConnectionStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const sendConnectionRequestSchema = z.object({
  addresseeId: z.string().min(1),
  message: z.string().optional(),
});

const respondToConnectionSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

/**
 * Send a connection request
 */
export const sendConnectionRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validation = sendConnectionRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { addresseeId, message } = validation.data;

    // Can't connect to yourself
    if (userId === addresseeId) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    // Check if addressee exists
    const addressee = await prisma.user.findUnique({
      where: { id: addresseeId },
    });

    if (!addressee) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId },
          { requesterId: addresseeId, addresseeId: userId },
        ],
      },
    });

    if (existingConnection) {
      if (existingConnection.status === ConnectionStatus.ACCEPTED) {
        return res.status(400).json({ error: 'Already connected' });
      }
      if (existingConnection.status === ConnectionStatus.PENDING) {
        return res.status(400).json({ error: 'Connection request already pending' });
      }
      // If rejected, allow resending after some time
      if (existingConnection.status === ConnectionStatus.REJECTED) {
        const daysSinceRejection = Math.floor(
          (Date.now() - existingConnection.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceRejection < 30) {
          return res.status(400).json({
            error: 'Please wait 30 days before sending another request'
          });
        }
      }
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        requesterId: userId,
        addresseeId,
        message,
        status: ConnectionStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create notification for addressee
    await prisma.notification.create({
      data: {
        userId: addresseeId,
        type: 'CONNECTION_REQUEST',
        data: {
          connectionId: connection.id,
          requesterId: userId,
          requesterName: (req as any).user.displayName,
          message,
        },
      },
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
};

/**
 * Respond to a connection request (accept/reject)
 */
export const respondToConnection = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { connectionId } = req.params;
    const validation = respondToConnectionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { action } = validation.data;

    // Find connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Only the addressee can respond
    if (connection.addresseeId !== userId) {
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    }

    // Can only respond to pending requests
    if (connection.status !== ConnectionStatus.PENDING) {
      return res.status(400).json({ error: 'Connection request is not pending' });
    }

    // Update connection status
    const newStatus = action === 'accept' ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED;
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: newStatus },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
          },
        },
      },
    });

    // If accepted, create notification for requester
    if (action === 'accept') {
      await prisma.notification.create({
        data: {
          userId: connection.requesterId,
          type: 'CONNECTION_ACCEPTED',
          data: {
            connectionId: connection.id,
            acceptedBy: userId,
            acceptedByName: (req as any).user.displayName,
          },
        },
      });
    }

    res.json(updatedConnection);
  } catch (error) {
    console.error('Error responding to connection:', error);
    res.status(500).json({ error: 'Failed to respond to connection request' });
  }
};

/**
 * Get my connections (accepted only)
 */
export const getMyConnections = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: ConnectionStatus.ACCEPTED },
          { addresseeId: userId, status: ConnectionStatus.ACCEPTED },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            location: true,
            roles: true,
          },
        },
        addressee: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            location: true,
            roles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to return the other user (not the current user)
    const connectionsWithUsers = connections.map((conn) => ({
      id: conn.id,
      user: conn.requesterId === userId ? conn.addressee : conn.requester,
      connectedAt: conn.createdAt,
    }));

    res.json(connectionsWithUsers);
  } catch (error) {
    console.error('Error getting connections:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
};

/**
 * Get pending connection requests (received)
 */
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const pendingRequests = await prisma.connection.findMany({
      where: {
        addresseeId: userId,
        status: ConnectionStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            avatarUrl: true,
            location: true,
            roles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(pendingRequests);
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
};

/**
 * Remove a connection
 */
export const removeConnection = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { connectionId } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Only participants can remove the connection
    if (connection.requesterId !== userId && connection.addresseeId !== userId) {
      return res.status(403).json({ error: 'Not authorized to remove this connection' });
    }

    await prisma.connection.delete({
      where: { id: connectionId },
    });

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
};

/**
 * Get connection status with a specific user
 */
export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { userId: targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.json({ status: 'self' });
    }

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    if (!connection) {
      return res.json({ status: 'none' });
    }

    res.json({
      status: connection.status.toLowerCase(),
      connectionId: connection.id,
      isRequester: connection.requesterId === userId,
    });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
};
