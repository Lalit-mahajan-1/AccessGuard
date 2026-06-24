import { Router } from 'express';
import { analyzeUrl } from '../controllers/urlController.js';
import { crawlLinks } from '../controllers/crawlerController.js';
import { LighthouseReport } from '../controllers/LightHouseController.js';
import { fullAudit } from '../controllers/auditController.js';

const router = Router();

router.post('/analyze', analyzeUrl);
router.post('/crawler', crawlLinks);
router.post('/lighthouse', LighthouseReport);
router.post('/audit', fullAudit);   // 🔥 combined endpoint

export default router;