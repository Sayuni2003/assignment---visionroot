import { Router } from 'express';

import {
  cancel,
  create,
  getById,
  list,
  update,
  updateStatus,
} from '../controllers/request.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Every request route needs a logged-in user. Ownership (a USER only sees their own requests)
// is enforced in the service, not here.
router.use(authenticate);

router.get('/', list);
router.post('/', authorize('USER'), create);
router.get('/:id', getById);
router.patch('/:id', authorize('USER'), update);
// Cancels the request (status becomes CANCELLED); the document is never deleted.
router.delete('/:id', authorize('USER'), cancel);
router.patch('/:id/status', authorize('ADMIN'), updateStatus);

export default router;
