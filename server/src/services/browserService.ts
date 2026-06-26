import { chromium } from 'playwright';
import type { Browser, Page, CDPSession } from 'playwright';
import { perfObserverScript } from '../utils/perfObserver.js';

export interface BrowserSession {
  browser: Browser;
  page: Page;
  cdp: CDPSession;
}

export const launchBrowser = async (): Promise<BrowserSession> => {
  console.log('[BrowserService] Launching Chromium (headless)...');
  const launchStart = Date.now();

  // headless: true for production/server environments
  // --no-sandbox is required for Docker and some Windows environments
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  // Enable CDP domains for logging, network, performance, etc.
  await cdp.send('Log.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  await cdp.send('Accessibility.enable');

  // Inject Web Vitals observer script BEFORE navigation so it captures LCP/CLS/FCP
  await page.addInitScript(perfObserverScript);

  const elapsed = Date.now() - launchStart;
  console.log(`[BrowserService] Browser launched in ${elapsed}ms`);

  return { browser, page, cdp };
};

export const navigateAndWait = async (page: Page, url: string): Promise<void> => {
  console.log(`[BrowserService] Navigating to ${url}...`);
  const navStart = Date.now();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait extra time for lazy assets, JS execution, and LCP to settle
  // Reduced from 5000ms to 3000ms to speed up total audit time
  await page.waitForTimeout(3000);

  const elapsed = Date.now() - navStart;
  console.log(`[BrowserService] Navigation + wait complete in ${elapsed}ms`);
};
