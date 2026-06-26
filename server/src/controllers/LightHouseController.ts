import type { Request, Response } from 'express';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const REPORTS_DIR = join(process.cwd(), 'public', 'reports');
if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

// 🔹 Reusable core logic
export const lighthouseData = async (url: string, req: Request) => {
  const startTime = Date.now();
  console.log(`[Lighthouse] Starting audit for ${url}`);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
  console.log(`[Lighthouse] Chrome launched on port ${chrome.port}`);

  try {
    const options: any = {
      logLevel: 'error',
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    console.log(`[Lighthouse] Running audit...`);
    const runnerResult = await lighthouse(url, options);

    if (!runnerResult) throw new Error('Lighthouse returned no result');

    console.log(`[Lighthouse] Audit complete. Saving report...`);

    const reportId = `${randomUUID()}.html`;
    const reportPath = join(REPORTS_DIR, reportId);
    writeFileSync(reportPath, runnerResult.report as string);

    const reportUrl = `${req.protocol}://${req.get('host')}/reports/${reportId}`;

    const lhr = runnerResult.lhr;
    const audits = lhr.audits;

    const formatAudit = (a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description?.slice(0, 200),
      score: a.score,
      displayValue: a.displayValue || null,
    });

    const failedOpportunities = Object.values(audits)
      .filter(
        (a: any) =>
          a.score !== null && a.score < 0.9 && a.details?.type === 'opportunity'
      )
      .sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1));

    const top = failedOpportunities[0] as any;
    const topSuggestion = top ? formatAudit(top) : null;

    const insights = failedOpportunities.slice(0, 10).map(formatAudit);

    const diagnostics = Object.values(audits)
      .filter(
        (a: any) =>
          a.details?.type === 'debugdata' || (a as any).group === 'diagnostics'
      )
      .filter((a: any) => a.score === null || a.score < 0.9)
      .slice(0, 10)
      .map(formatAudit);

    const manualChecks = Object.values(audits)
      .filter((a: any) => a.scoreDisplayMode === 'manual')
      .slice(0, 10)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description?.slice(0, 200),
      }));

    const general = Object.values(audits)
      .filter((a: any) => a.scoreDisplayMode === 'informative' && a.details)
      .slice(0, 10)
      .map(formatAudit);

    const trustAndSafetyIds = [
      'is-on-https',
      'geolocation-on-start',
      'notification-on-start',
      'no-vulnerable-libraries',
      'csp-xss',
      'clickjacking-mitigation',
      'has-hsts',
      'origin-isolation',
      'deprecations',
      'errors-in-console',
    ];

    const trustAndSafety = trustAndSafetyIds
      .map((id) => audits[id])
      .filter((a: any) => a && a.score !== null && a.score < 1)
      .map(formatAudit);

    await chrome.kill();

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`[Lighthouse] Total time: ${elapsed}s`);

    return {
      reportUrl,
      scores: {
        performance: lhr.categories.performance?.score,
        accessibility: lhr.categories.accessibility?.score,
        bestPractices: lhr.categories['best-practices']?.score,
        seo: lhr.categories.seo?.score,
      },
      suggestion: {
        top: topSuggestion,
        insights,
        diagnostics,
        manualChecks,
        general,
        trustAndSafety,
      },
    };
  } catch (err) {
    await chrome.kill();
    console.error(`[Lighthouse] ERROR:`, err);
    throw err;
  }
};

// 🔹 Express handler
export const LighthouseReport = async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    const data = await lighthouseData(url, req);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
