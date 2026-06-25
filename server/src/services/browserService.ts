import { chromium } from 'playwright';
import type { Browser, Page, CDPSession } from 'playwright';
import { perfObserverScript } from '../utils/perfObserver.js';

export interface BrowserSession {
  browser: Browser;
  page: Page;
  cdp: CDPSession;
}

export const launchBrowser = async (): Promise<BrowserSession> => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  await cdp.send('Log.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  await cdp.send('Accessibility.enable');

  await page.addInitScript(perfObserverScript);

  return { browser, page, cdp };
};

export const navigateAndWait = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
};
