// routes/repoRoutes.ts
import { Router } from 'express';
import { detectRepo } from '../controllers/repoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/detect', protect, detectRepo);
export default router;