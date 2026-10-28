import { Router } from 'express';
import { acceptConnection, createConnection, listConnections, listPendingConnections, rejectConnection } from '../controllers/connection';
import { requireAuth } from '../middleware/auth';

const connectionRouter = Router();

connectionRouter.get('/', requireAuth, listConnections);
connectionRouter.get('/pending', requireAuth, listPendingConnections);
connectionRouter.post('/', requireAuth, createConnection);
connectionRouter.post('/:id/accept', requireAuth, acceptConnection);
connectionRouter.post('/:id/reject', requireAuth, rejectConnection);

export default connectionRouter;