import { Router } from 'express';

import { listUsers } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), listUsers);

export default router;
