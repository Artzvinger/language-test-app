import { Router } from 'express';
import {
	submitResultHandler,
	listResultsHandler,
	deleteResultHandler
} from '../controllers/results.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', submitResultHandler);
router.get('/', requireAuth, listResultsHandler);
router.delete('/:id', requireAuth, deleteResultHandler);

export default router;
