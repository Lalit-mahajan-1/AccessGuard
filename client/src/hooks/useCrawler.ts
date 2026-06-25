"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runCrawler } from "@/lib/api";
import type { CrawlerResponse } from "@/schemas/auditSchema";

// Query Keys for caching
export const crawlerKeys = {
  all: ["crawler"] as const,
  crawl: (url: string) => [...crawlerKeys.all, "crawl", url] as const,
};

/**
 * Hook for crawling a website to find internal pages
 */
export const useCrawlerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => runCrawler(url),
    onSuccess: (data: CrawlerResponse) => {
      // Cache the result
      queryClient.setQueryData(crawlerKeys.crawl(data.baseUrl), data);
      console.log("[Crawler] Success:", data.baseUrl, "Found:", data.totalFound);
    },
    onError: (error: Error) => {
      console.error("[Crawler] Failed:", error.message);
    },
  });
};