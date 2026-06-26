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
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

export default router;