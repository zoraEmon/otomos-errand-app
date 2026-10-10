import { Router } from 'express';
import { acceptConnection, createConnection, listConnections } from '../controllers/connection';
import { requireAuth } from '../middleware/auth';

const connectionRouter = Router();

connectionRouter.get('/', requireAuth, listConnections);
connectionRouter.post('/', requireAuth, createConnection);
connectionRouter.post('/:id/accept', requireAuth, acceptConnection);

export default connectionRouter;