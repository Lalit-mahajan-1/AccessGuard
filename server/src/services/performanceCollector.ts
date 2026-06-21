import type { CDPSession, Page } from 'playwright';

export const collectPerformance = async (page: Page, cdp: CDPSession) => {
  const webVitals = await page.evaluate(() => (window as any).__perfData);
  const perfMetrics = await cdp.send('Performance.getMetrics');

  const pick = (name: string) =>
    perfMetrics.metrics.find((m: any) => m.name === name)?.value;

  return {
    webVitals: {
      lcp_ms: +webVitals.lcp.toFixed(2),
      fcp_ms: +webVitals.fcp.toFixed(2),
      cls: +webVitals.cls.toFixed(4),
      longTasks: webVitals.longTasks,
    },
    runtime: {
      domNodes: pick('Nodes'),
      jsEventListeners: pick('JSEventListeners'),
      layoutCount: pick('LayoutCount'),
      layoutDuration_s: +pick('LayoutDuration')?.toFixed(3),
      scriptDuration_s: +pick('ScriptDuration')?.toFixed(3),
      taskDuration_s: +pick('TaskDuration')?.toFixed(3),
    },
  };
};