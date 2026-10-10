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
      create: vi.fn(),
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
