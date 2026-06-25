// AccessGuard API client
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import type { AuditResponse, CrawlerResponse, ApiError } from "@/schemas/auditSchema";
import { mockAuditResponse, delay, isDemoMode } from "./mockData";

// Axios instance with Next.js environment variable
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 120000, // 2 minutes for heavy Lighthouse audits
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with Premium Error Toast
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred while connecting to the server.";

    console.error(`[API Error] ${message}`);
    // Show premium toast notification
    toast.error(message, {
      description: "Please check your URL or backend server.",
    });
    
    return Promise.reject(new Error(message));
  }
);

// --- API Functions ---

export const runAudit = async (url: string): Promise<AuditResponse> => {
  if (isDemoMode()) {
    await delay(3000);
    return { ...mockAuditResponse, url, timestamp: new Date().toISOString() };
  }
  const { data } = await api.post<AuditResponse>("/audit", { url });
  return data;
};

export const runAnalyze = async (url: string): Promise<AuditResponse["analyze"]> => {
  if (isDemoMode()) {
    await delay(2000);
    return mockAuditResponse.analyze;
  }
  const { data } = await api.post("/analyze", { url });
  return data;
};

export const runLighthouse = async (url: string): Promise<AuditResponse["lighthouse"]> => {
  if (isDemoMode()) {
    await delay(2000);
    return mockAuditResponse.lighthouse;
  }
  const { data } = await api.post("/lighthouse", { url });
  return data;
};

export const runCrawler = async (url: string): Promise<CrawlerResponse> => {
  if (isDemoMode()) {
    await delay(1500);
    const baseUrl = new URL(url).origin;
    return {
      baseUrl,
      urls: [`${baseUrl}/`, `${baseUrl}/about`, `${baseUrl}/contact`],
      totalFound: 3,
    };
  }
  const { data } = await api.post<{ success: boolean; source: string; count: number; links: string[] }>("/crawler", { url });
  return {
    baseUrl: data.source,
    urls: data.links,
    totalFound: data.count,
  };
};

export default api;