import { Router } from 'express';
import { createConnection } from '../controllers/connection';
import { requireAuth } from '../middleware/auth';

const connectionRouter = Router();

connectionRouter.post('/', requireAuth, createConnection);

export default connectionRouter;