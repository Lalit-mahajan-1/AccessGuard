import { Router } from 'express';
import { createProject, listProjects, stopProject } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', protect, createProject);
router.get('/', protect, listProjects);
router.post('/stop', protect, stopProject);

export default router;