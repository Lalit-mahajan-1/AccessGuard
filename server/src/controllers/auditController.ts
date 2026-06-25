import type { Request, Response } from 'express';
import { analyzeUrlData } from './urlController.js';
import { lighthouseData } from './LightHouseController.js';

export const fullAudit = async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    // Run both in parallel
    const [analyze, lighthouse] = await Promise.allSettled([
      analyzeUrlData(url),
      lighthouseData(url, req),
    ]);

    res.json({
      success: true,
      url,
      analyze: analyze.status === 'fulfilled' ? analyze.value : { error: analyze.reason?.message },
      lighthouse:
        lighthouse.status === 'fulfilled' ? lighthouse.value : { error: lighthouse.reason?.message },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
