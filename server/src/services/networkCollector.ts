import type { CDPSession } from 'playwright';

export const createNetworkCollector = (cdp: CDPSession) => {
  const networkMap: Record<string, any> = {};

  cdp.on('Network.requestWillBeSent', (e: any) => {
    networkMap[e.requestId] = {
      url: e.request.url,
      method: e.request.method,
      type: e.type,
      startTime: e.timestamp,
    };
  });

  cdp.on('Network.responseReceived', (e: any) => {
    if (!networkMap[e.requestId]) return;
    const r = networkMap[e.requestId];
    const t = e.response.timing;
    const h = e.response.headers;

    r.status = e.response.status;
    r.mimeType = e.response.mimeType;
    r.protocol = e.response.protocol;
    r.remoteIP = e.response.remoteIPAddress;
    r.ttfb = t ? +(t.receiveHeadersEnd - t.sendEnd).toFixed(2) : null;
    r.server = h['server'] || null;
    r.securityHeaders = {
      hsts: !!h['strict-transport-security'],
      csp: !!h['content-security-policy'],
      xFrame: h['x-frame-options'] || null,
      xContentType: h['x-content-type-options'] || null,
      referrerPolicy: h['referrer-policy'] || null,
    };
  });

  cdp.on('Network.loadingFinished', (e: any) => {
    if (!networkMap[e.requestId]) return;
    networkMap[e.requestId].sizeKB = +(e.encodedDataLength / 1024).toFixed(2);
  });

  cdp.on('Network.loadingFailed', (e: any) => {
    if (!networkMap[e.requestId]) return;
    networkMap[e.requestId].failed = true;
    networkMap[e.requestId].errorText = e.errorText;
  });

  const getResult = (pageUrl: string) => {
    const all = Object.values(networkMap);

    const failed = all.filter((r: any) => r.failed || (r.status && r.status >= 400));
    const slow = all
      .filter((r: any) => r.ttfb && r.ttfb > 500)
      .map((r: any) => ({ url: r.url, ttfb: r.ttfb, status: r.status }));

    const byType: Record<string, { count: number; sizeKB: number }> = {};
    all.forEach((r: any) => {
      const t = r.type || 'Other';
      if (!byType[t]) byType[t] = { count: 0, sizeKB: 0 };
      byType[t].count++;
      byType[t].sizeKB += r.sizeKB || 0;
    });
    Object.keys(byType).forEach((k) => (byType[k].sizeKB = +byType[k].sizeKB.toFixed(2)));

    const thirdParty = [
      ...new Set(
        all
          .map((r: any) => {
            try {
              return new URL(r.url).hostname;
            } catch {
              return null;
            }
          })
          .filter((h) => h && !h.includes(new URL(pageUrl).hostname))
      ),
    ];

    const mainDoc = all.find((r: any) => r.type === 'Document');

    return {
      totalRequests: all.length,
      totalSizeKB: +all.reduce((s: number, r: any) => s + (r.sizeKB || 0), 0).toFixed(2),
      byType,
      failedCount: failed.length,
      failed: failed.slice(0, 10).map((r: any) => ({
        url: r.url,
        status: r.status,
        error: r.errorText,
      })),
      slowRequests: slow.slice(0, 10),
      thirdPartyDomains: thirdParty.slice(0, 30),
      mainDocument: mainDoc
        ? {
            status: mainDoc.status,
            protocol: mainDoc.protocol,
            server: mainDoc.server,
            ttfb: mainDoc.ttfb,
            securityHeaders: mainDoc.securityHeaders,
          }
        : null,
    };
  };

  return { getResult };
};