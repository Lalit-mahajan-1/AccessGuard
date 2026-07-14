// routes/repoRoutes.ts
import { Router } from 'express';
import { detectRepo, listProjects, getProjectById, deleteProject, runProjectAudit, getProjectAudits } from '../controllers/repoController.js';
import { generateProjectPlan } from '../controllers/PlannerAgentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/detect', protect, detectRepo);
router.get('/', protect, listProjects);
router.get('/:id', protect, getProjectById);
router.delete('/:id', protect, deleteProject);
router.post('/:id/audit', protect, runProjectAudit);
router.get('/:id/audits', protect, getProjectAudits);
router.post('/:id/audit/:auditId/plan', protect, generateProjectPlan);

export default router;