import { Router } from 'express';
import { analyzeUrl } from '../controllers/urlController.js';
import { crawlLinks } from '../controllers/crawlerController.js';


const router = Router();

router.post('/analyze', analyzeUrl);
router.post('/crawler', crawlLinks);


export default router;