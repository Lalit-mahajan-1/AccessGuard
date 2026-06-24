import type { Request, Response } from 'express';
import { launchBrowser, navigateAndWait } from '../services/browserService.js';
import { createConsoleCollector } from '../services/consoleCollector.js';
import { createNetworkCollector } from '../services/networkCollector.js';
import { collectPerformance } from '../services/performanceCollector.js';
import { collectMemory } from '../services/memoryCollector.js';
import { collectAccessibility } from '../services/accessibilityCollector.js';
import { collectAxe } from '../services/axeCollector.js';

// 🔹 Reusable core logic
export const analyzeUrlData = async (url: string) => {
  const session = await launchBrowser();
  const { browser, page, cdp } = session;

  try {
    const consoleCollector = createConsoleCollector(cdp);
    const networkCollector = createNetworkCollector(cdp);

    await navigateAndWait(page, url);

    const performance = await collectPerformance(page, cdp);
    const memory = await collectMemory(cdp);
    const accessibility = await collectAccessibility(page);
    const axeCore = await collectAxe(page);

    await browser.close();

    return {
      console: consoleCollector.getResult(),
      network: networkCollector.getResult(url),
      performance,
      memory,
      accessibility,
      axeCore,
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
};

// 🔹 Express handler (just calls the core function)
export const analyzeUrl = async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    const data = await analyzeUrlData(url);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};