import { z } from "zod";

export const auditSchema = z.object({
  url: z.string()
    .min(1, { message: "URL is required" })
    .url({ message: "Please enter a valid URL (e.g., https://example.com)" })
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: "URL must start with http:// or https://",
    }),
});

export type AuditFormValues = z.infer<typeof auditSchema>;

export interface AuditResponse {
  success: boolean;
  url: string;
  timestamp?: string;
  analyze?: {
    performanceMetrics?: {
      webVitals?: {
        lcp_ms: number;
        fcp_ms: number;
        cls: number;
        longTasks: number;
      };
      runtime?: {
        domNodes: number;
        jsEventListeners: number;
        layoutCount: number;
        layoutDuration_s: number;
        scriptDuration_s: number;
        taskDuration_s: number;
      };
    };
    accessibility?: {
      totalViolations: number;
      byImpact: {
        critical: number;
        serious: number;
        moderate: number;
        minor: number;
      };
      violations: Array<{
        id: string;
        impact: "critical" | "serious" | "moderate" | "minor";
        description: string;
        help: string;
        wcag: string[];
        nodeCount: number;
        nodes: Array<{
          selector: string;
          html: string;
          failure: string;
        }>;
      }>;
    };
    consoleLogs?: {
      total: number;
      errors: number;
      warnings: number;
      logs: Array<{
        source: string;
        level: "error" | "warning" | "info" | "log";
        text: string;
      }>;
    };
    networkRequests?: {
      totalRequests: number;
      totalSizeKB: number;
      failedCount: number;
      failed: Array<{ url: string; status: number; error?: string }>;
      slowRequests: Array<{ url: string; ttfb: number; status: number }>;
      thirdPartyDomains: string[];
      byType: Record<string, { count: number; sizeKB: number }>;
      mainDocument: {
        status: number;
        protocol: string;
        server: string | null;
        ttfb: number | null;
        securityHeaders: {
          hsts: boolean;
          csp: boolean;
          xFrame: string | null;
          xContentType: string | null;
          referrerPolicy: string | null;
        };
      } | null;
    };
  };
  lighthouse?: {
    reportUrl: string;
    scores: {
      performance: number | null;
      accessibility: number | null;
      bestPractices: number | null;
      seo: number | null;
    };
    suggestion?: {
      top: any;
      insights: any[];
      diagnostics: any[];
      manualChecks: any[];
      general: any[];
      trustAndSafety: any[];
    };
  };
}

export interface CrawlerResponse {
  baseUrl: string;
  urls: string[];
  totalFound: number;
}

export interface ApiError {
  message: string;
}