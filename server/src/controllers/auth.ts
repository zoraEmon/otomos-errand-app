// server/src/controllers/auth.ts

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SignupSchema } from '../../../shared/contracts/auth.contract';
import { generateCode7 } from '../../../shared/contracts/code7';
import prisma from '../prisma/client';

const MAX_CODE_RETRIES = 5;
const BCRYPT_ROUNDS = 12;

export const signup = async (req: Request, res: Response) => {
  try {
    const parsedInput = SignupSchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(400).json({
        error: 'Invalid signup payload.',
        details: parsedInput.error.flatten().fieldErrors,
      });
    }

    const { username, password } = parsedInput.data;
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let createdUser = null;
    let attempts = 0;

    // Collision Retry Loop
    while (attempts < MAX_CODE_RETRIES) {
      const candidateCode = generateCode7();

      try {
        createdUser = await prisma.user.create({
          data: {
            username,
            passwordHash: hashedPassword,
            code7: candidateCode,
          },
        });
        break; 
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          const target = error.meta?.target;
          if (error.code === 'P2002' && Array.isArray(target) && target.includes('code7')) {
            attempts++;
            continue;
          }
        }
        throw error; 
      }
    }

    if (!createdUser) {
      return res.status(500).json({ 
        error: 'Failed to generate a unique friend code. Please try again.' 
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const token = `Bearer ${jwt.sign(
      { username: createdUser.username },
      jwtSecret,
      { subject: createdUser.id, expiresIn: '7d' },
    )}`;

    return res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        code7: createdUser.code7,
        createdAt: createdUser.createdAt.toISOString(),
      },
    });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Username is already taken.' });
    }
    
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};