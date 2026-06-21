import { Router } from 'express';
import { analyzeUrl } from '../controllers/urlController.js';

const router = Router();

router.post('/analyze', analyzeUrl);

export default router;