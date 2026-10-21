import { Router } from 'express';
import { uploadTestHandler } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../lib/upload.js';

const router = Router();

router.post('/', requireAuth, upload.single('file'), uploadTestHandler);

export default router;
