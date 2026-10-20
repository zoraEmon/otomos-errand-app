import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { CreateErrandSchema, UpdateErrandItemSchema } from '../../../shared/contracts/errand.contract';
import type { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../prisma/client';

export async function createErrand(req: Request, res: Response) {
  try {
    const parsedInput = CreateErrandSchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(400).json({
        error: 'Invalid errand payload.',
        details: parsedInput.error.flatten().fieldErrors,
      });
    }

    const commanderId = (req as AuthenticatedRequest).auth.userId;
    const { runnerId, items, instructions, notes } = parsedInput.data;
    if (runnerId === commanderId) {
      return res.status(400).json({ error: 'You cannot assign an errand to yourself.' });
    }

    const runner = await prisma.user.findUnique({ where: { id: runnerId }, select: { id: true } });
    if (!runner) return res.status(404).json({ error: 'Runner not found.' });

    const connection = await prisma.connection.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { userAId: commanderId, userBId: runnerId },
          { userAId: runnerId, userBId: commanderId },
        ],
      },
      select: { id: true },
    });
    if (!connection) {
      return res.status(403).json({ error: 'An accepted connection with the runner is required.' });
    }

    const errand = await prisma.errand.create({
      data: {
        commanderId,
        runnerId,
        instructions: instructions ?? notes,
        status: 'pending_acceptance',
        items: {
          create: items.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });
    return res.status(201).json({ errand });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(404).json({ error: 'Runner not found.' });
    }
    console.error('Create errand error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function getErrand(req: Request, res: Response) {
  const requesterId = (req as AuthenticatedRequest).auth.userId;
  const errand = await prisma.errand.findUnique({
    where: { id: String(req.params.id) },
    include: { items: true },
  });
  if (!errand) return res.status(404).json({ error: 'Errand not found.' });
  if (errand.commanderId !== requesterId && errand.runnerId !== requesterId) {
    return res.status(403).json({ error: 'You cannot view this errand.' });
  }
  return res.status(200).json({ errand });
}

export async function updateErrandItem(req: Request, res: Response) {
  const parsedInput = UpdateErrandItemSchema.safeParse(req.body);
  if (!parsedInput.success) {
    return res.status(400).json({
      error: 'Invalid errand item payload.',
      details: parsedInput.error.flatten().fieldErrors,
    });
  }

  const requesterId = (req as AuthenticatedRequest).auth.userId;
  const item = await prisma.errandItem.findUnique({
    where: { id: String(req.params.itemId) },
    include: { errand: true },
  });
  if (!item) return res.status(404).json({ error: 'Errand item not found.' });
  if (item.errand.commanderId !== requesterId && item.errand.runnerId !== requesterId) {
    return res.status(403).json({ error: 'You cannot update this errand item.' });
  }

  const updatedItem = await prisma.errandItem.update({
    where: { id: item.id },
    data: { isBought: parsedInput.data.isBought },
  });
  return res.status(200).json({ item: updatedItem });
}
