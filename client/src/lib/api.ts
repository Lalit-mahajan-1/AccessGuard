import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { AuditResponse, CrawlerResponse, ApiError } from '@/schemas/auditSchema';

interface AuditApiResponse {
  success: boolean;
  url: string;
  analyze?: AuditResponse['analyze'];
  lighthouse?: AuditResponse['lighthouse'];
}

interface AnalyzeApiResponse {
  data?: {
    performance?: AuditResponse['analyze'] extends infer Analyze
      ? Analyze extends { performanceMetrics?: infer Metrics }
        ? Metrics
        : never
      : never;
    axeCore?: AuditResponse['analyze'] extends infer Analyze
      ? Analyze extends { accessibility?: infer Accessibility }
        ? Accessibility
        : never
      : never;
    console?: AuditResponse['analyze'] extends infer Analyze
      ? Analyze extends { consoleLogs?: infer ConsoleLogs }
        ? ConsoleLogs
        : never
      : never;
    network?: AuditResponse['analyze'] extends infer Analyze
      ? Analyze extends { networkRequests?: infer NetworkRequests }
        ? NetworkRequests
        : never
      : never;
  };
}

// Axios instance
// Timeout increased to 5 minutes because Lighthouse + Playwright together can take 2-3 minutes on slower machines
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 300000, // 5 minutes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} at ${new Date().toLocaleTimeString()}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with Premium Error Toast
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url} - Status: ${response.status} at ${new Date().toLocaleTimeString()}`);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred while connecting to the server.';

    console.error(`[API Error] ${message}`);

    toast.error(message, {
      description: 'Backend is taking too long or is unreachable. Please check if the server is running.',
    });

    return Promise.reject(new Error(message));
  }
);

// --- Health Check (Ping) ---
export const pingServer = async (): Promise<boolean> => {
  try {
    await api.get('/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

// --- API Functions ---

export const runAudit = async (url: string): Promise<AuditResponse> => {
  const { data } = await api.post<AuditApiResponse>('/audit', { url });
  return {
    success: data.success,
    url: data.url,
    timestamp: new Date().toISOString(),
    analyze: data.analyze ? {
      performanceMetrics: data.analyze.performanceMetrics,
      accessibility: data.analyze.accessibility,
      consoleLogs: data.analyze.consoleLogs,
      networkRequests: data.analyze.networkRequests,
    } : undefined,
    lighthouse: data.lighthouse ? {
      reportUrl: data.lighthouse.reportUrl,
      scores: data.lighthouse.scores,
      suggestion: data.lighthouse.suggestion,
    } : undefined,
  };
};

export const runAnalyze = async (url: string): Promise<AuditResponse['analyze']> => {
  const { data } = await api.post<AnalyzeApiResponse>('/analyze', { url });
  const analyzeData = data.data;
  return {
    performanceMetrics: {
      webVitals: analyzeData?.performance?.webVitals,
      runtime: analyzeData?.performance?.runtime,
    },
    accessibility: analyzeData?.axeCore,
    consoleLogs: analyzeData?.console,
    networkRequests: analyzeData?.network,
  };
};

export const runLighthouse = async (url: string): Promise<AuditResponse['lighthouse']> => {
  const { data } = await api.post('/lighthouse', { url });
  return data;
};

export const runCrawler = async (url: string): Promise<CrawlerResponse> => {
  const { data } = await api.post<{
    success: boolean;
    source: string;
    count: number;
    links: string[];
  }>('/crawler', { url });

  return {
    baseUrl: data.source,
    urls: data.links,
    totalFound: data.count,
  };
};

export default api;
