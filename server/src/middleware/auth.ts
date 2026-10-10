import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthenticatedRequest = Request & {
  auth: {
    userId: string
    username?: string
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('Authorization');
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured.' });
  }

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(authorization.slice(7), jwtSecret);
    if (typeof payload === 'string' || !payload.sub) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    (req as AuthenticatedRequest).auth = {
      userId: payload.sub,
      username: typeof payload.username === 'string' ? payload.username : undefined,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}