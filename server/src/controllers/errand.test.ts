import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';

vi.mock('../prisma/client', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    connection: {
      findFirst: vi.fn(),
    },
    errand: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    errandItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const JWT_SECRET = 'errand-test-secret';
const commanderId = '11111111-1111-4111-8111-111111111111';
const runnerId = '22222222-2222-4222-8222-222222222222';

function authHeader(userId = commanderId) {
  const token = jwt.sign({ username: 'commander' }, JWT_SECRET, { subject: userId });
  return `Bearer ${token}`;
}

const validPayload = {
  runnerId,
  items: [{ itemName: '  Milk  ', quantity: 2, notes: 'Whole milk' }],
  instructions: 'Use the nearest store.',
};

describe('POST /api/errands', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.clearAllMocks();
  });

  describe('PATCH /api/errands/:id/items/:itemId', () => {
    const errandId = '33333333-3333-4333-8333-333333333333';
    const itemId = '44444444-4444-4444-8444-444444444444';
    const activeErrand = { id: errandId, commanderId, runnerId, status: 'active' };
    const item = { id: itemId, errandId, itemName: 'Milk', quantity: 1, isBought: false, errand: activeErrand };

    beforeEach(() => {
      process.env.JWT_SECRET = JWT_SECRET;
      vi.clearAllMocks();
    });

    it('requires authentication', async () => {
      const response = await request(app)
        .patch(`/api/errands/${errandId}/items/${itemId}`)
        .send({ isBought: true });

      expect(response.status).toBe(401);
    });

    it('allows only the assigned runner while active', async () => {
      vi.mocked(prisma.errandItem.findUnique).mockResolvedValueOnce(item as never);
      vi.mocked(prisma.errandItem.update).mockResolvedValueOnce({ ...item, isBought: true } as never);

      const response = await request(app)
        .patch(`/api/errands/${errandId}/items/${itemId}`)
        .set('Authorization', authHeader(runnerId))
        .send({ isBought: true });

      expect(response.status).toBe(200);
      expect(response.body.item.isBought).toBe(true);
      expect(prisma.errandItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { isBought: true },
      });
    });

    it('rejects the commander', async () => {
      vi.mocked(prisma.errandItem.findUnique).mockResolvedValueOnce(item as never);

      const response = await request(app)
        .patch(`/api/errands/${errandId}/items/${itemId}`)
        .set('Authorization', authHeader(commanderId))
        .send({ isBought: true });

      expect(response.status).toBe(403);
      expect(prisma.errandItem.update).not.toHaveBeenCalled();
    });

    it('rejects an item that belongs to another errand', async () => {
      vi.mocked(prisma.errandItem.findUnique).mockResolvedValueOnce({
        ...item,
        errand: { ...activeErrand, id: '55555555-5555-4555-8555-555555555555' },
      } as never);

      const response = await request(app)
        .patch(`/api/errands/${errandId}/items/${itemId}`)
        .set('Authorization', authHeader(runnerId))
        .send({ isBought: true });

      expect(response.status).toBe(404);
      expect(prisma.errandItem.update).not.toHaveBeenCalled();
    });

    it('rejects malformed errand and item identifiers', async () => {
      const response = await request(app)
        .patch('/api/errands/not-an-id/items/not-an-id')
        .set('Authorization', authHeader(runnerId))
        .send({ isBought: true });

      expect(response.status).toBe(404);
      expect(prisma.errandItem.findUnique).not.toHaveBeenCalled();
    });

    it.each(['pending_acceptance', 'closed'])('rejects updates when errand is %s', async (status) => {
      vi.mocked(prisma.errandItem.findUnique).mockResolvedValueOnce({
        ...item,
        errand: { ...activeErrand, status },
      } as never);

      const response = await request(app)
        .patch(`/api/errands/${errandId}/items/${itemId}`)
        .set('Authorization', authHeader(runnerId))
        .send({ isBought: true });

      expect(response.status).toBe(400);
      expect(prisma.errandItem.update).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/errands/:id/status', () => {
    const errandId = '33333333-3333-4333-8333-333333333333';

    beforeEach(() => {
      process.env.JWT_SECRET = JWT_SECRET;
      vi.clearAllMocks();
    });

    it('allows the runner lifecycle from pending to active to completed', async () => {
      const pending = { id: errandId, commanderId, runnerId, status: 'pending_acceptance' };
      const active = { ...pending, status: 'active' };
      const completed = { ...active, status: 'completed_by_runner' };
      vi.mocked(prisma.errand.findUnique)
        .mockResolvedValueOnce(pending as never)
        .mockResolvedValueOnce(active as never);
      vi.mocked(prisma.errand.update)
        .mockResolvedValueOnce(active as never)
        .mockResolvedValueOnce(completed as never);

      const accepted = await request(app)
        .patch(`/api/errands/${errandId}/status`)
        .set('Authorization', authHeader(runnerId))
        .send({ status: 'active' });
      const finished = await request(app)
        .patch(`/api/errands/${errandId}/status`)
        .set('Authorization', authHeader(runnerId))
        .send({ status: 'completed_by_runner' });

      expect(accepted.status).toBe(200);
      expect(finished.status).toBe(200);
    });

    it('allows the commander to close a completed errand', async () => {
      const completed = { id: errandId, commanderId, runnerId, status: 'completed_by_runner' };
      vi.mocked(prisma.errand.findUnique).mockResolvedValueOnce(completed as never);
      vi.mocked(prisma.errand.update).mockResolvedValueOnce({ ...completed, status: 'closed' } as never);

      const response = await request(app)
        .patch(`/api/errands/${errandId}/status`)
        .set('Authorization', authHeader(commanderId))
        .send({ status: 'closed' });

      expect(response.status).toBe(200);
    });

    it('rejects invalid lifecycle jumps', async () => {
      vi.mocked(prisma.errand.findUnique).mockResolvedValueOnce({
        id: errandId,
        commanderId,
        runnerId,
        status: 'pending_acceptance',
      } as never);

      const response = await request(app)
        .patch(`/api/errands/${errandId}/status`)
        .set('Authorization', authHeader(runnerId))
        .send({ status: 'completed_by_runner' });

      expect(response.status).toBe(400);
      expect(prisma.errand.update).not.toHaveBeenCalled();
    });

    it('requires the assigned runner or commander for lifecycle transitions', async () => {
      vi.mocked(prisma.errand.findUnique).mockResolvedValueOnce({
        id: errandId,
        commanderId,
        runnerId,
        status: 'active',
      } as never);

      const response = await request(app)
        .patch(`/api/errands/${errandId}/status`)
        .set('Authorization', authHeader(commanderId))
        .send({ status: 'completed_by_runner' });

      expect(response.status).toBe(403);
      expect(prisma.errand.update).not.toHaveBeenCalled();
    });

    it('rejects malformed status route parameters', async () => {
      const response = await request(app)
        .patch('/api/errands/not-an-id/status')
        .set('Authorization', authHeader(runnerId))
        .send({ status: 'active' });

      expect(response.status).toBe(404);
      expect(prisma.errand.findUnique).not.toHaveBeenCalled();
    });
  });

  it('requires authentication', async () => {
    const response = await request(app).post('/api/errands').send(validPayload);

    expect(response.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid JWT', async () => {
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', 'Bearer invalid-token')
      .send(validPayload);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid authentication token.');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an expired JWT', async () => {
    const token = jwt.sign(
      { username: 'commander' },
      JWT_SECRET,
      { subject: commanderId, expiresIn: -1 },
    );
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid authentication token.');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an empty items array', async () => {
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send({ runnerId, items: [] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid errand payload.');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a blank item name', async () => {
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send({ runnerId, items: [{ itemName: '   ', quantity: 1 }] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid errand payload.');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a zero quantity', async () => {
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send({ runnerId, items: [{ itemName: 'Milk', quantity: 0 }] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid errand payload.');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a negative quantity', async () => {
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send({ runnerId, items: [{ itemName: 'Milk', quantity: -1 }] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid errand payload.');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid UUID runner ID', async () => {
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send({ ...validPayload, runnerId: 'not-a-uuid' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid errand payload.');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('prevents self-assignment', async () => {
    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send({ ...validPayload, runnerId: commanderId });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('You cannot assign an errand to yourself.');
  });

  it('returns 404 when the runner does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send(validPayload);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Runner not found.');
  });

  it('returns 403 without an accepted connection', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: runnerId } as never);
    vi.mocked(prisma.connection.findFirst).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send(validPayload);

    expect(response.status).toBe(403);
    expect(prisma.errand.create).not.toHaveBeenCalled();
  });

  it('creates an errand with nested items', async () => {
    const createdErrand = {
      id: '33333333-3333-4333-8333-333333333333',
      commanderId,
      runnerId,
      status: 'pending_acceptance',
      instructions: validPayload.instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [{
        id: '44444444-4444-4444-8444-444444444444',
        errandId: '33333333-3333-4333-8333-333333333333',
        itemName: 'Milk',
        quantity: 2,
        notes: 'Whole milk',
        isBought: false,
      }],
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: runnerId } as never);
    vi.mocked(prisma.connection.findFirst).mockResolvedValueOnce({ id: 'connection-1' } as never);
    vi.mocked(prisma.errand.create).mockResolvedValueOnce(createdErrand);

    const response = await request(app)
      .post('/api/errands')
      .set('Authorization', authHeader())
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.errand).toMatchObject({
      commanderId,
      runnerId,
      status: 'pending_acceptance',
    });
    expect(prisma.errand.create).toHaveBeenCalledWith({
      data: {
        commanderId,
        runnerId,
        instructions: 'Use the nearest store.',
        status: 'pending_acceptance',
        items: {
          create: [{ itemName: 'Milk', quantity: 2, notes: 'Whole milk' }],
        },
      },
      include: { items: true },
    });
  });
});
