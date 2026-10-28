import { Router } from 'express';
import { acceptErrand, createErrand, getErrand, listErrands, rejectErrand, updateErrandItem, updateErrandStatus } from '../controllers/errand';
import { requireAuth } from '../middleware/auth';

const errandRouter = Router();

errandRouter.post('/', requireAuth, createErrand);
errandRouter.get('/', requireAuth, listErrands);
errandRouter.post('/:id/accept', requireAuth, acceptErrand);
errandRouter.post('/:id/reject', requireAuth, rejectErrand);
errandRouter.patch('/:id/status', requireAuth, updateErrandStatus);
errandRouter.get('/:id', requireAuth, getErrand);
errandRouter.patch('/:id/items/:itemId', requireAuth, updateErrandItem);

export default errandRouter;
