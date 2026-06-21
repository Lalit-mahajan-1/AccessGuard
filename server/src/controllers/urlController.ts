import type { Request, Response } from 'express';
import { launchBrowser, navigateAndWait } from '../services/browserService.js';
import { createConsoleCollector } from '../services/consoleCollector.js';
import { createNetworkCollector } from '../services/networkCollector.js';
import { collectPerformance } from '../services/performanceCollector.js';
import { collectMemory } from '../services/memoryCollector.js';
import { collectAccessibility } from '../services/accessibilityCollector.js';
import { collectAxe } from '../services/axeCollector.js';

export const analyzeUrl = async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  let browser;
  try {
    const session = await launchBrowser();
    browser = session.browser;
    const { page, cdp } = session;

    // Attach collectors BEFORE navigation
    const consoleCollector = createConsoleCollector(cdp);
    const networkCollector = createNetworkCollector(cdp);

    // Navigate
    await navigateAndWait(page, url);

    // Collect data
    const performance = await collectPerformance(page, cdp);
    const memory = await collectMemory(cdp);
    const accessibility = await collectAccessibility(page);
    const axeCore = await collectAxe(page);

    await browser.close();

    res.json({
      success: true,
      data: {
        console: consoleCollector.getResult(),
        network: networkCollector.getResult(url),
        performance,
        memory,
        accessibility,
        axeCore,
      },
    });
  } catch (err: any) {
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: err.message });
  }
};