import { Router } from 'express';
import { createProject, listProjects, stopProject } from '../controllers/projectController.js';

const router = Router();

router.post('/', createProject);
router.get('/', listProjects);
router.post('/stop', stopProject);

export default router;