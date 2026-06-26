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
    // Run Playwright first, then Lighthouse sequentially
    let analyzeResult: any;
    try {
      analyzeResult = { status: 'fulfilled', value: await analyzeUrlData(url) };
    } catch (err: any) {
      analyzeResult = { status: 'rejected', reason: err };
    }

    let lighthouseResult: any;
    try {
      lighthouseResult = { status: 'fulfilled', value: await lighthouseData(url, req) };
    } catch (err: any) {
      lighthouseResult = { status: 'rejected', reason: err };
    }

    // Map backend raw data to the EXACT shape frontend expects (AuditResponse)
    const analyze =
      analyzeResult.status === 'fulfilled'
        ? {
            performanceMetrics: analyzeResult.value.performance,
            // axeCore has the exact shape AccessibilityTab expects (violations[], byImpact, totalViolations)
            accessibility: analyzeResult.value.axeCore,
            consoleLogs: analyzeResult.value.console,
            networkRequests: analyzeResult.value.network,
            memory: analyzeResult.value.memory,
          }
        : { error: analyzeResult.reason?.message };

    const lighthouse =
      lighthouseResult.status === 'fulfilled'
        ? lighthouseResult.value
        : { error: lighthouseResult.reason?.message };

    res.json({
      success: true,
      url,
      analyze,
      lighthouse,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
