import { Router } from 'express';
import {
	listTestsHandler,
	getTestHandler,
	deleteTestHandler
} from '../controllers/tests.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', listTestsHandler);
router.get('/:id', getTestHandler);
router.delete('/:id', requireAuth, deleteTestHandler);

export default router;
