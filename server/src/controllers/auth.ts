// server/src/controllers/auth.ts

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { generateCode7 } from '../../../shared/contracts/code7';
import prisma from '../prisma/client';
// import { hashPassword, generateToken } from '../utils/auth'; 

const MAX_CODE_RETRIES = 5;

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate inputs here...
    // const hashedPassword = await hashPassword(password);

    let createdUser = null;
    let attempts = 0;

    // Collision Retry Loop
    while (attempts < MAX_CODE_RETRIES) {
      const candidateCode = generateCode7();

      try {
        createdUser = await prisma.user.create({
          data: {
            username,
            passwordHash: 'hashedPasswordPlaceholder',
            code7: candidateCode,
          },
        });
        
        // Break the loop if creation is successful
        break; 
        
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002: Unique constraint failed
          const target = error.meta?.target as string[];
          if (error.code === 'P2002' && target?.includes('code7')) {
            attempts++;
            continue; // Retry with a new code
          }
        }
        // If it's a different error (e.g., username taken), throw it to the outer catch
        throw error; 
      }
    }

    if (!createdUser) {
      return res.status(500).json({ 
        error: 'Failed to generate a unique friend code. Please try again.' 
      });
    }

    // Generate authentication token
    // const token = generateToken(createdUser.id);
    const token = 'example-jwt-token-123';

    // Payload Contract
    return res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        code7: createdUser.code7,
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