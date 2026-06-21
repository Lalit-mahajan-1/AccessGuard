import type { CDPSession } from 'playwright';

export const collectMemory = async (cdp: CDPSession) => {
  const perfMetrics = await cdp.send('Performance.getMetrics');

  const pick = (name: string) =>
    perfMetrics.metrics.find((m: any) => m.name === name)?.value;

  return {
    jsHeapUsedMB: +(pick('JSHeapUsedSize') / 1048576).toFixed(2),
    jsHeapTotalMB: +(pick('JSHeapTotalSize') / 1048576).toFixed(2),
    documents: pick('Documents'),
    frames: pick('Frames'),
  };
};