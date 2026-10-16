import { Router } from 'express';
import { createErrand } from '../controllers/errand';
import { requireAuth } from '../middleware/auth';

const errandRouter = Router();

errandRouter.post('/', requireAuth, createErrand);

export default errandRouter;
