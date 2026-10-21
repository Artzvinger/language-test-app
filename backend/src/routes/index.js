import { Router } from 'express';
import authRoutes from './auth.routes.js';
import testsRoutes from './tests.routes.js';
import resultsRoutes from './results.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tests', testsRoutes);
router.use('/results', resultsRoutes);
router.use('/upload', uploadRoutes);

export default router;
