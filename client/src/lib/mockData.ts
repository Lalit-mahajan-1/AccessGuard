export const isDemoMode = (): boolean => {
  if (typeof window !== "undefined") {
    return window.location.search.includes("demo=true") || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuditResponse = {
  success: true,
  url: "https://example.com",
  timestamp: new Date().toISOString(),
  analyze: {
    performanceMetrics: {
      webVitals: {
        lcp_ms: 1200,
        fcp_ms: 800,
        cls: 0.05,
        longTasks: 0,
      },
      runtime: {
        domNodes: 450,
        jsEventListeners: 28,
        layoutCount: 15,
        layoutDuration_s: 0.12,
        scriptDuration_s: 0.45,
        taskDuration_s: 0.65,
      },
    },
    accessibility: {
      totalViolations: 1,
      byImpact: { critical: 0, serious: 1, moderate: 0, minor: 0 },
      violations: [
        {
          id: "image-alt",
          impact: "serious" as const,
          description: "Ensures <img> elements have alternate text or a role of none or presentation",
          help: "Images must have alternate text",
          wcag: ["wcag2a", "wcag111"],
          nodeCount: 1,
          nodes: [
            {
              selector: "img.hero-banner",
              html: '<img src="/banner.jpg" class="hero-banner">',
              failure: "Fix details: Alternate text is missing.",
            },
          ],
        },
      ],
    },
    consoleLogs: {
      total: 1,
      errors: 0,
      warnings: 1,
      logs: [
        {
          source: "console-api",
          level: "warning" as const,
          text: "React DevTools is running in development mode.",
        },
      ],
    },
    networkRequests: {
      totalRequests: 12,
      totalSizeKB: 340,
      failedCount: 0,
      failed: [],
      slowRequests: [],
      thirdPartyDomains: ["cdnjs.cloudflare.com"],
      byType: {
        Document: { count: 1, sizeKB: 45 },
        Script: { count: 4, sizeKB: 180 },
        Stylesheet: { count: 2, sizeKB: 35 },
        Image: { count: 5, sizeKB: 80 },
      },
      mainDocument: {
        status: 200,
        protocol: "h2",
        server: "nginx",
        ttfb: 120,
        securityHeaders: {
          hsts: true,
          csp: false,
          xFrame: "SAMEORIGIN",
          xContentType: "nosniff",
          referrerPolicy: "no-referrer-when-downgrade",
        },
      },
    },
  },
  lighthouse: {
    reportUrl: "#",
    scores: {
      performance: 0.92,
      accessibility: 0.88,
      bestPractices: 0.95,
      seo: 0.9,
    },
    suggestion: {
      top: {
        id: "unused-javascript",
        title: "Reduce unused JavaScript",
        description: "Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.",
        score: 0.75,
        displayValue: "Potential savings of 120KB",
      },
      insights: [],
      diagnostics: [],
      manualChecks: [],
      general: [],
      trustAndSafety: [],
    },
  },
};
