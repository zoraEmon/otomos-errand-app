import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import authRouter from './routes/auth';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'otomos-api',
    },
  });
});

app.use('/api/auth', authRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Error]: ${err.message}`);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message,
    },
  });
});

export default app;
