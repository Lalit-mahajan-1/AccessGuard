import type { CDPSession, Page } from 'playwright';

export const collectPerformance = async (page: Page, cdp: CDPSession) => {
  const webVitals = await page.evaluate(() => (window as any).__perfData);
  const perfMetrics = await cdp.send('Performance.getMetrics');

  const pick = (name: string): number | undefined =>
    perfMetrics.metrics.find((m: any) => m.name === name)?.value;
  const roundMetric = (name: string, digits: number) => {
    const value = pick(name);
    return value === undefined ? undefined : +value.toFixed(digits);
  };

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
      layoutDuration_s: roundMetric('LayoutDuration', 3),
      scriptDuration_s: roundMetric('ScriptDuration', 3),
      taskDuration_s: roundMetric('TaskDuration', 3),
    },
  };
};
