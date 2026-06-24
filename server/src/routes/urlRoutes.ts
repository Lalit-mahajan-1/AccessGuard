import { Router } from 'express';
import { analyzeUrl } from '../controllers/urlController.js';
import { crawlLinks } from '../controllers/crawlerController.js';
import { LighthouseReport } from '../controllers/LightHouseController.js';


const router = Router();

router.post('/analyze', analyzeUrl);
router.post('/crawler', crawlLinks);
router.post('/lighthouse',LighthouseReport)

export default router;