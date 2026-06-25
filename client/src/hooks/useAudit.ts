"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runAudit, runAnalyze, runLighthouse } from "@/lib/api";
import type { AuditResponse } from "@/schemas/auditSchema";

// Query Keys for caching
export const auditKeys = {
  all: ["audits"] as const,
  audit: (url: string) => [...auditKeys.all, "audit", url] as const,
  analyze: (url: string) => [...auditKeys.all, "analyze", url] as const,
  lighthouse: (url: string) => [...auditKeys.all, "lighthouse", url] as const,
};

/**
 * Hook for running full audit (analyze + lighthouse combined)
 */
export const useAuditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => runAudit(url),
    onSuccess: (data: AuditResponse) => {
      // Cache the result
      queryClient.setQueryData(auditKeys.audit(data.url), data);
      console.log("[Audit] Success:", data.url);
    },
    onError: (error: Error) => {
      console.error("[Audit] Failed:", error.message);
    },
  });
};

/**
 * Hook for running analyze only
 */
export const useAnalyzeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => runAnalyze(url),
    onSuccess: (data, url) => {
      queryClient.setQueryData(auditKeys.analyze(url), data);
      console.log("[Analyze] Success:", url);
    },
    onError: (error: Error) => {
      console.error("[Analyze] Failed:", error.message);
    },
  });
};

/**
 * Hook for running lighthouse only
 */
export const useLighthouseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => runLighthouse(url),
    onSuccess: (data, url) => {
      queryClient.setQueryData(auditKeys.lighthouse(url), data);
      console.log("[Lighthouse] Success:", url);
    },
    onError: (error: Error) => {
      console.error("[Lighthouse] Failed:", error.message);
    },
  });
};