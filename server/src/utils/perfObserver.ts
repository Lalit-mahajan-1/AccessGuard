// Script injected into the browser BEFORE navigation to capture Web Vitals
export const perfObserverScript = () => {
  (window as any).__perfData = { lcp: 0, cls: 0, longTasks: 0, fcp: 0 };

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      (window as any).__perfData.lcp = entry.startTime;
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any[]) {
      if (!entry.hadRecentInput) (window as any).__perfData.cls += entry.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });

  new PerformanceObserver((list) => {
    (window as any).__perfData.longTasks += list.getEntries().length;
  }).observe({ type: 'longtask', buffered: true });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint')
        (window as any).__perfData.fcp = entry.startTime;
    }
  }).observe({ type: 'paint', buffered: true });
};