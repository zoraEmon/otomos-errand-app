import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Adjust these paths to point to your actual Express app and Prisma client
import app from '../app';
import prisma from '../prisma/client';

// Mock the Prisma Client
vi.mock('../prisma/client', () => ({
  default: {
    user: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/auth/signup Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hash the password and return a Bearer JWT upon successful registration', async () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      passwordHash: 'hashed-password',
      code7: 'ABC123X',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Simulate a successful DB insertion on the first try
    vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser);

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', password: 'Password123' });

    expect(response.status).toBe(201);
    expect(response.body.token).toMatch(/^Bearer .+\..+\..+$/);
    expect(jwt.verify(response.body.token.slice(7), process.env.JWT_SECRET as string)).toMatchObject({
      sub: mockUser.id,
      username: mockUser.username,
    });
    const createData = vi.mocked(prisma.user.create).mock.calls[0][0].data;
    expect(createData.passwordHash).not.toBe('Password123');
    await expect(bcrypt.compare('Password123', createData.passwordHash)).resolves.toBe(true);
    expect(response.body.user).toEqual({
      id: mockUser.id,
      username: mockUser.username,
      code7: mockUser.code7,
      createdAt: mockUser.createdAt.toISOString(),
    });
  });

  it('should reject passwords that do not meet the complexity requirements', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', password: 'password' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid signup payload.');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should handle P2002 code7 collision by retrying and succeeding', async () => {
    // Construct the specific Prisma constraint error
    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0', // Adjust to your version if needed
      meta: { target: ['code7'] }
    });

    const mockUser = {
      id: 'user-456',
      username: 'collisionuser',
      passwordHash: 'hashed-password',
      code7: 'NEWCOD7',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 1st attempt: Reject with P2002 collision
    // 2nd attempt: Resolve successfully
    vi.mocked(prisma.user.create)
      .mockRejectedValueOnce(p2002Error)
      .mockResolvedValueOnce(mockUser);

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'collisionuser', password: 'Password123' });

    expect(response.status).toBe(201);
    
    // Crucial: Ensure Prisma was called twice because of the retry loop
    expect(prisma.user.create).toHaveBeenCalledTimes(2);
    
    // Ensure the final response returns the payload from the second attempt
    expect(response.body.user.code7).toBe('NEWCOD7');
  });

  it('should return 409 when the username is already taken', async () => {
    const usernameConflict = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['username'] },
    });
    vi.mocked(prisma.user.create).mockRejectedValue(usernameConflict);

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'takenuser', password: 'Password123' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Username is already taken.');
  });

  it('should fail with a 500 error if code7 collision limit is exceeded', async () => {
    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['code7'] }
    });

    // Reject 5 times in a row (or whatever your retry limit is)
    vi.mocked(prisma.user.create).mockRejectedValue(p2002Error);

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'unluckyuser', password: 'Password123' });

    // Assuming your app returns a 500 or 409 when it gives up
    expect(response.status).toBeGreaterThanOrEqual(400); 
    
    // Ensure the loop tried the correct number of times (e.g., 1 initial + 5 retries = 6)
    // Adjust the expected call count based on how you wrote your while/for loop.
    expect(prisma.user.create).toHaveBeenCalledTimes(5); 
  });
});