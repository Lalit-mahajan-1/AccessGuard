import type { Request, Response } from 'express';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const REPORTS_DIR = join(process.cwd(), 'public', 'reports');

if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

export const LighthouseReport = async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  let chrome;
  try {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

    const options: any = {
      logLevel: 'error',
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    if (!runnerResult) throw new Error('Lighthouse returned no result');

    // Save HTML report
    const reportId = `${randomUUID()}.html`;
    const reportPath = join(REPORTS_DIR, reportId);
    writeFileSync(reportPath, runnerResult.report as string);
    const reportUrl = `${req.protocol}://${req.get('host')}/reports/${reportId}`;

    const lhr = runnerResult.lhr;
    const audits = lhr.audits;

    // Helper: format audit into compact object
    const formatAudit = (a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description?.slice(0, 200),
      score: a.score,
      displayValue: a.displayValue || null,
    });

    // Helper: get failed audits filtered by category group
    const getByGroup = (groupId: string) =>
      Object.values(audits)
        .filter(
          (a: any) =>
            (a as any).group === groupId &&
            a.score !== null &&
            a.score < 0.9
        )
        .map(formatAudit);

    // ===== TOP SUGGESTION (biggest opportunity) =====
    const failedOpportunities = Object.values(audits)
      .filter(
        (a: any) =>
          a.score !== null &&
          a.score < 0.9 &&
          a.details?.type === 'opportunity'
      )
      .sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1));

    const top = failedOpportunities[0] as any;
    const topSuggestion = top ? formatAudit(top) : null;

    // ===== INSIGHTS (performance opportunities) =====
    const insights = failedOpportunities.slice(0, 10).map(formatAudit);

    // ===== DIAGNOSTICS =====
    const diagnostics = Object.values(audits)
      .filter(
        (a: any) =>
          a.details?.type === 'debugdata' ||
          (a as any).group === 'diagnostics'
      )
      .filter((a: any) => a.score === null || a.score < 0.9)
      .slice(0, 10)
      .map(formatAudit);

    // ===== MANUAL CHECKS =====
    const manualChecks = Object.values(audits)
      .filter((a: any) => a.scoreDisplayMode === 'manual')
      .slice(0, 10)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description?.slice(0, 200),
      }));

    // ===== GENERAL (informative / not-applicable items worth noting) =====
    const general = Object.values(audits)
      .filter(
        (a: any) =>
          a.scoreDisplayMode === 'informative' &&
          a.details
      )
      .slice(0, 10)
      .map(formatAudit);

    // ===== TRUST AND SAFETY (best-practices related) =====
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

    res.json({
      success: true,
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
    });
  } catch (err: any) {
    if (chrome) await chrome.kill();
    res.status(500).json({ success: false, error: err.message });
  }
};