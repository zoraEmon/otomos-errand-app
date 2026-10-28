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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const JWT_SECRET = 'connection-test-secret';
const requester = {
  id: 'user-a',
  username: 'requester',
  code7: 'ABC1234',
  passwordHash: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const target = {
  id: 'user-b',
  username: 'target',
  code7: 'XYZ5678',
  passwordHash: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function authHeader(userId = requester.id) {
  const token = jwt.sign(
    { username: requester.username },
    JWT_SECRET,
    { subject: userId },
  );
  return `Bearer ${token}`;
}

describe('POST /api/connections', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.clearAllMocks();
  });

  it('should reject requests without a Bearer token', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({ targetCode7: target.code7 });

    expect(response.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should return 400 for an invalid payload', async () => {
    const response = await request(app)
      .post('/api/connections')
      .set('Authorization', authHeader())
      .send({ targetCode7: 'bad' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid connection payload.');
  });

  it('should return 404 when the target code does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/connections')
      .set('Authorization', authHeader())
      .send({ targetCode7: target.code7 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found.');
  });

  it('should return 400 when the requester uses their own code', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(requester);

    const response = await request(app)
      .post('/api/connections')
      .set('Authorization', authHeader())
      .send({ targetCode7: requester.code7 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('You cannot connect with yourself.');
  });

  it('should return 409 when a connection already exists in either direction', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(target);
    vi.mocked(prisma.connection.findFirst).mockResolvedValueOnce({
      id: 'connection-1',
      userAId: target.id,
      userBId: requester.id,
      status: 'accepted',
      createdAt: new Date(),
    });

    const response = await request(app)
      .post('/api/connections')
      .set('Authorization', authHeader())
      .send({ targetCode7: target.code7 });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Connection already exists.');
    expect(prisma.connection.create).not.toHaveBeenCalled();
  });

  it('should create a pending connection request', async () => {
    const createdConnection = {
      id: 'connection-2',
      userAId: requester.id,
      userBId: target.id,
      status: 'pending',
      createdAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(target);
    vi.mocked(prisma.connection.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.connection.create).mockResolvedValueOnce(createdConnection);

    const response = await request(app)
      .post('/api/connections')
      .set('Authorization', authHeader())
      .send({ targetCode7: target.code7 });

    expect(response.status).toBe(201);
    expect(response.body.connection).toMatchObject({
      id: createdConnection.id,
      status: 'pending',
      userAId: requester.id,
      userBId: target.id,
    });
    expect(prisma.connection.create).toHaveBeenCalledWith({
      data: {
        status: 'pending',
        userAId: requester.id,
        userBId: target.id,
      },
    });
  });
});

describe('GET /api/connections', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.clearAllMocks();
  });

  it('should return accepted friends without exposing connection or password data', async () => {
    vi.mocked(prisma.connection.findMany).mockResolvedValueOnce([
      {
        id: 'connection-accepted-1',
        userAId: requester.id,
        userBId: target.id,
        status: 'accepted',
        createdAt: new Date(),
        userA: requester,
        userB: target,
      } as never,
    ]);

    const response = await request(app)
      .get('/api/connections')
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: target.id,
        username: target.username,
        code7: target.code7,
      },
    ]);
    expect(response.body[0]).not.toHaveProperty('passwordHash');
    expect(prisma.connection.findMany).toHaveBeenCalledWith({
      where: {
        status: 'accepted',
        OR: [
          { userAId: requester.id },
          { userBId: requester.id },
        ],
      },
      include: {
        userA: true,
        userB: true,
      },
    });
  });

  it('should return an empty list when the requester has no accepted friends', async () => {
    vi.mocked(prisma.connection.findMany).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/connections')
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe('POST /api/connections/:id/accept', () => {
  const connectionId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.clearAllMocks();
  });

  describe('GET /api/connections/pending', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = JWT_SECRET;
      vi.clearAllMocks();
    });

    it('should return incoming pending requests with sender details', async () => {
      const createdAt = new Date('2026-10-20T18:00:00.000Z');
      vi.mocked(prisma.connection.findMany).mockResolvedValueOnce([{
        id: 'connection-pending-1',
        userAId: requester.id,
        userBId: target.id,
        status: 'pending',
        createdAt,
        userA: requester,
      } as never]);

      const response = await request(app)
        .get('/api/connections/pending')
        .set('Authorization', authHeader(target.id));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{
        id: 'connection-pending-1',
        sender: {
          id: requester.id,
          username: requester.username,
          code7: requester.code7,
        },
        createdAt: createdAt.toISOString(),
      }]);
      expect(prisma.connection.findMany).toHaveBeenCalledWith({
        where: { userBId: target.id, status: 'pending' },
        include: { userA: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('POST /api/connections/:id/reject', () => {
    const connectionId = '22222222-2222-4222-8222-222222222222';

    beforeEach(() => {
      process.env.JWT_SECRET = JWT_SECRET;
      vi.clearAllMocks();
    });

    it('should allow either participant to reject a pending request', async () => {
      vi.mocked(prisma.connection.findUnique).mockResolvedValueOnce({
        id: connectionId,
        userAId: requester.id,
        userBId: target.id,
        status: 'pending',
        createdAt: new Date(),
      });
      vi.mocked(prisma.connection.delete).mockResolvedValueOnce({ id: connectionId } as never);

      const response = await request(app)
        .post(`/api/connections/${connectionId}/reject`)
        .set('Authorization', authHeader(target.id));

      expect(response.status).toBe(204);
      expect(prisma.connection.delete).toHaveBeenCalledWith({ where: { id: connectionId } });
    });
  });

  it('should return 404 when the connection does not exist', async () => {
    vi.mocked(prisma.connection.findUnique).mockResolvedValueOnce(null);

    const response = await request(app)
      .post(`/api/connections/${connectionId}/accept`)
      .set('Authorization', authHeader());

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Connection not found.');
  });

  it('should return 403 when the requester is not the recipient', async () => {
    vi.mocked(prisma.connection.findUnique).mockResolvedValueOnce({
      id: connectionId,
      userAId: requester.id,
      userBId: target.id,
      status: 'pending',
      createdAt: new Date(),
    });

    const response = await request(app)
      .post(`/api/connections/${connectionId}/accept`)
      .set('Authorization', authHeader(requester.id));

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('You cannot accept this connection.');
    expect(prisma.connection.update).not.toHaveBeenCalled();
  });

  it('should return 400 when the connection is already accepted', async () => {
    vi.mocked(prisma.connection.findUnique).mockResolvedValueOnce({
      id: connectionId,
      userAId: requester.id,
      userBId: target.id,
      status: 'accepted',
      createdAt: new Date(),
    });

    const response = await request(app)
      .post(`/api/connections/${connectionId}/accept`)
      .set('Authorization', authHeader(target.id));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Connection is already accepted.');
    expect(prisma.connection.update).not.toHaveBeenCalled();
  });

  it('should accept a pending connection for its recipient', async () => {
    const pendingConnection = {
      id: connectionId,
      userAId: requester.id,
      userBId: target.id,
      status: 'pending',
      createdAt: new Date(),
    };
    const acceptedConnection = { ...pendingConnection, status: 'accepted' };
    vi.mocked(prisma.connection.findUnique).mockResolvedValueOnce(pendingConnection);
    vi.mocked(prisma.connection.update).mockResolvedValueOnce(acceptedConnection);

    const response = await request(app)
      .post(`/api/connections/${connectionId}/accept`)
      .set('Authorization', authHeader(target.id));

    expect(response.status).toBe(200);
    expect(response.body.connection).toMatchObject({
      id: connectionId,
      status: 'accepted',
      userAId: requester.id,
      userBId: target.id,
    });
    expect(prisma.connection.update).toHaveBeenCalledWith({
      where: { id: connectionId },
      data: { status: 'accepted' },
    });
  });
});
