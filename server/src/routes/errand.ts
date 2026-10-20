import { Router } from 'express';
import { createErrand, getErrand, updateErrandItem } from '../controllers/errand';
import { requireAuth } from '../middleware/auth';

const errandRouter = Router();

errandRouter.post('/', requireAuth, createErrand);
errandRouter.get('/:id', requireAuth, getErrand);
errandRouter.patch('/:id/items/:itemId', requireAuth, updateErrandItem);

export default errandRouter;
