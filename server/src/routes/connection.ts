import { Router } from 'express';
import { acceptConnection, createConnection } from '../controllers/connection';
import { requireAuth } from '../middleware/auth';

const connectionRouter = Router();

connectionRouter.post('/', requireAuth, createConnection);
connectionRouter.post('/:id/accept', requireAuth, acceptConnection);

export default connectionRouter;