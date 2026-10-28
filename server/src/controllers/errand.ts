import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { CreateErrandSchema, UpdateErrandItemSchema, UpdateErrandStatusSchema } from '../../../shared/contracts/errand.contract';
import { UuidParamSchema } from '../../../shared/contracts/common.contract';
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

export async function listErrands(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).auth.userId;
    const errands = await prisma.errand.findMany({
      where: { OR: [{ commanderId: userId }, { runnerId: userId }] },
      include: { commander: true, runner: true, _count: { select: { items: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.status(200).json(errands.map((errand) => ({
      id: errand.id,
      role: errand.runnerId === userId ? 'runner' : 'commander',
      status: errand.status,
      itemCount: errand._count.items,
      otherUser: errand.runnerId === userId
        ? { id: errand.commander.id, username: errand.commander.username, code7: errand.commander.code7 }
        : { id: errand.runner.id, username: errand.runner.username, code7: errand.runner.code7 },
    })));
  } catch (error) {
    console.error('List errands error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function acceptErrand(req: Request, res: Response) {
  return updateErrandInvitation(req, res, 'active');
}

export async function rejectErrand(req: Request, res: Response) {
  return updateErrandInvitation(req, res, 'rejected');
}

async function updateErrandInvitation(req: Request, res: Response, status: 'active' | 'rejected') {
  try {
    const userId = (req as AuthenticatedRequest).auth.userId;
    const errand = await prisma.errand.findUnique({ where: { id: String(req.params.id) } });
    if (!errand) return res.status(404).json({ error: 'Errand not found.' });
    if (errand.runnerId !== userId) return res.status(403).json({ error: 'You cannot update this errand invitation.' });
    if (errand.status !== 'pending_acceptance') return res.status(400).json({ error: 'Errand invitation is not pending.' });
    const updatedErrand = await prisma.errand.update({ where: { id: errand.id }, data: { status } });
    return res.status(200).json({ errand: updatedErrand });
  } catch (error) {
    console.error('Update errand invitation error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function updateErrandItem(req: Request, res: Response) {
  const parsedParams = UuidParamSchema.extend({ itemId: UuidParamSchema.shape.id }).safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(404).json({ error: 'Errand item not found.' });
  }

  const parsedInput = UpdateErrandItemSchema.safeParse(req.body);
  if (!parsedInput.success) {
    return res.status(400).json({
      error: 'Invalid errand item payload.',
      details: parsedInput.error.flatten().fieldErrors,
    });
  }

  const requesterId = (req as AuthenticatedRequest).auth.userId;
  const item = await prisma.errandItem.findUnique({
    where: { id: parsedParams.data.itemId },
    include: { errand: true },
  });
  if (!item) return res.status(404).json({ error: 'Errand item not found.' });
  if (item.errand.id !== parsedParams.data.id) {
    return res.status(404).json({ error: 'Errand item not found.' });
  }
  if (item.errand.runnerId !== requesterId) {
    return res.status(403).json({ error: 'Only the assigned runner can update this errand item.' });
  }
  if (item.errand.status !== 'active') {
    return res.status(400).json({ error: 'Errand items can only be updated while the errand is active.' });
  }

  const updatedItem = await prisma.errandItem.update({
    where: { id: item.id },
    data: { isBought: parsedInput.data.isBought },
  });
  return res.status(200).json({ item: updatedItem });
}

const validTransitions: Record<string, string[]> = {
  pending_acceptance: ['active'],
  active: ['completed_by_runner'],
  completed_by_runner: ['closed'],
  rejected: [],
  closed: [],
};

export async function updateErrandStatus(req: Request, res: Response) {
  const parsedParams = UuidParamSchema.safeParse(req.params);
  if (!parsedParams.success) return res.status(404).json({ error: 'Errand not found.' });

  const parsedInput = UpdateErrandStatusSchema.safeParse(req.body);
  if (!parsedInput.success) {
    return res.status(400).json({
      error: 'Invalid errand status payload.',
      details: parsedInput.error.flatten().fieldErrors,
    });
  }

  try {
    const requesterId = (req as AuthenticatedRequest).auth.userId;
    const errand = await prisma.errand.findUnique({ where: { id: parsedParams.data.id } });
    if (!errand) return res.status(404).json({ error: 'Errand not found.' });

    const nextStatus = parsedInput.data.status;
    if (!validTransitions[errand.status]?.includes(nextStatus)) {
      return res.status(400).json({ error: `Invalid errand status transition: ${errand.status} to ${nextStatus}.` });
    }

    const runnerTransition = errand.status === 'pending_acceptance' || errand.status === 'active';
    const authorizedUserId = runnerTransition ? errand.runnerId : errand.commanderId;
    if (requesterId !== authorizedUserId) {
      return res.status(403).json({ error: runnerTransition
        ? 'Only the assigned runner can update this errand status.'
        : 'Only the commander can close this errand.' });
    }

    const updatedErrand = await prisma.errand.update({
      where: { id: errand.id },
      data: { status: nextStatus },
    });
    return res.status(200).json({ errand: updatedErrand });
  } catch (error) {
    console.error('Update errand status error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
