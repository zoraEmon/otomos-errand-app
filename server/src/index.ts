import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route (Acceptance Criteria Requirement)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    data: { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'otomos-api'
    } 
  });
});

// Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error]: ${err.message}`);
  res.status(500).json({ 
    success: false, 
    error: { 
      code: 'INTERNAL_SERVER_ERROR', 
      message: err.message 
    } 
  });
});

app.listen(port, () => {
  console.log(`🚀 Otomos server running on http://localhost:${port}`);
});