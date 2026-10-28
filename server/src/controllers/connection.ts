import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { UuidParamSchema } from '../../../shared/contracts/common.contract';
import { AddConnectionSchema } from '../../../shared/contracts/connection.contract';
import prisma from '../prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

export async function createConnection(req: Request, res: Response) {
  try {
    const parsedInput = AddConnectionSchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(400).json({
        error: 'Invalid connection payload.',
        details: parsedInput.error.flatten().fieldErrors,
      });
    }

    const requesterId = (req as AuthenticatedRequest).auth.userId;
    const targetUser = await prisma.user.findUnique({
      where: { code7: parsedInput.data.targetCode7 },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.id === requesterId) {
      return res.status(400).json({ error: 'You cannot connect with yourself.' });
    }

    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userAId: requesterId, userBId: targetUser.id },
          { userAId: targetUser.id, userBId: requesterId },
        ],
      },
    });

    if (existingConnection) {
      return res.status(409).json({ error: 'Connection already exists.' });
    }

    const connection = await prisma.connection.create({
      data: {
        userAId: requesterId,
        userBId: targetUser.id,
        status: 'pending',
      },
    });

    return res.status(201).json({ connection });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Connection already exists.' });
    }

    console.error('Connection request error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function listConnections(req: Request, res: Response) {
  try {
    const requesterId = (req as AuthenticatedRequest).auth.userId;
    const connections = await prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [
          { userAId: requesterId },
          { userBId: requesterId },
        ],
      },
      include: {
        userA: true,
        userB: true,
      },
    });

    const friends = connections.map((connection) => {
      const friend = connection.userAId === requesterId ? connection.userB : connection.userA;
      return {
        id: friend.id,
        username: friend.username,
        code7: friend.code7,
      };
    });

    return res.status(200).json(friends);
  } catch (error) {
    console.error('List connections error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function listPendingConnections(req: Request, res: Response) {
  try {
    const requesterId = (req as AuthenticatedRequest).auth.userId;
    const pending = await prisma.connection.findMany({
      where: { userBId: requesterId, status: 'pending' },
      include: { userA: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(pending.map((connection) => ({
      id: connection.id,
      sender: {
        id: connection.userA.id,
        username: connection.userA.username,
        code7: connection.userA.code7,
      },
      createdAt: connection.createdAt,
    })));
  } catch (error) {
    console.error('List pending connections error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function acceptConnection(req: Request, res: Response) {
  try {
    const parsedParams = UuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(404).json({ error: 'Connection not found.' });
    }

    const requesterId = (req as AuthenticatedRequest).auth.userId;
    const connection = await prisma.connection.findUnique({
      where: { id: parsedParams.data.id },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found.' });
    }

    if (connection.userBId !== requesterId) {
      return res.status(403).json({ error: 'You cannot accept this connection.' });
    }

    if (connection.status === 'accepted') {
      return res.status(400).json({ error: 'Connection is already accepted.' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ error: 'Connection is not pending.' });
    }

    const updatedConnection = await prisma.connection.update({
      where: { id: connection.id },
      data: { status: 'accepted' },
    });

    return res.status(200).json({ connection: updatedConnection });
  } catch (error) {
    console.error('Accept connection error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function rejectConnection(req: Request, res: Response) {
  try {
    const parsedParams = UuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(404).json({ error: 'Connection not found.' });
    }

    const requesterId = (req as AuthenticatedRequest).auth.userId;
    const connection = await prisma.connection.findUnique({
      where: { id: parsedParams.data.id },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found.' });
    }

    if (connection.userAId !== requesterId && connection.userBId !== requesterId) {
      return res.status(403).json({ error: 'You cannot reject this connection.' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ error: 'Connection is not pending.' });
    }

    await prisma.connection.delete({ where: { id: connection.id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Reject connection error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}