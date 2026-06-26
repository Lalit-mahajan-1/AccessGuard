"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, ExternalLink, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCrawlerMutation } from "@/hooks/useCrawler";
import { useAuditMutation } from "@/hooks/useAudit";
import type { AuditResponse } from "@/schemas/auditSchema";

interface CrawlerSectionProps {
  baseUrl: string;
  onPageAudited: (url: string, data: AuditResponse) => void;
  onViewReport?: (url: string) => void;
  activeReportUrl?: string;
}

interface PageAuditStatus {
  url: string;
  status: "pending" | "auditing" | "completed" | "failed";
  data?: AuditResponse;
  error?: string;
}

export function CrawlerSection({ baseUrl, onPageAudited, onViewReport, activeReportUrl }: CrawlerSectionProps) {
  const crawlerMutation = useCrawlerMutation();
  const auditMutation = useAuditMutation();

  const [pageStatuses, setPageStatuses] = useState<PageAuditStatus[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const handleCrawl = () => {
    crawlerMutation.mutate(baseUrl);
  };

  const toggleUrlSelection = (url: string) => {
    setSelectedUrls((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const selectAllUrls = () => {
    if (crawlerMutation.data?.urls) {
      setSelectedUrls(new Set(crawlerMutation.data.urls));
    }
  };

  const deselectAllUrls = () => {
    setSelectedUrls(new Set());
  };

  const auditSelectedPages = async () => {
    const urls = Array.from(selectedUrls);

    // Initialize statuses
    setPageStatuses(urls.map((url) => ({ url, status: "pending" })));

    // Audit pages sequentially to avoid overloading the server
    for (const url of urls) {
      setPageStatuses((prev) =>
        prev.map((p) => (p.url === url ? { ...p, status: "auditing" } : p))
      );

      try {
        const data = await auditMutation.mutateAsync(url);
        setPageStatuses((prev) =>
          prev.map((p) => (p.url === url ? { ...p, status: "completed", data } : p))
        );
        onPageAudited(url, data);
      } catch (error) {
        setPageStatuses((prev) =>
          prev.map((p) =>
            p.url === url
              ? { ...p, status: "failed", error: (error as Error).message }
              : p
          )
        );
      }
    }
  };

  const isAuditingPages = pageStatuses.some((p) => p.status === "auditing");

  // Safe helper to get pathname (handles invalid URLs gracefully)
  const getSafePathname = (url: string) => {
    try {
      return new URL(url).pathname || "/";
    } catch {
      return url;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              Discover & Audit More Pages
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Find all internal pages on this website and audit them
            </p>
          </div>

          {!crawlerMutation.data && (
            <button
              onClick={handleCrawl}
              disabled={crawlerMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {crawlerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Crawling...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  Discover Pages
                </>
              )}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {crawlerMutation.isError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <p className="font-medium">Failed to crawl website</p>
            <p className="text-sm">{(crawlerMutation.error as Error).message}</p>
            <button
              onClick={handleCrawl}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {crawlerMutation.data && crawlerMutation.data.urls && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found <strong>{crawlerMutation.data.totalFound}</strong> internal pages
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAllUrls}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={deselectAllUrls}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              {crawlerMutation.data.urls.length > 0 ? (
                crawlerMutation.data.urls.map((url, index) => {
                  const pageStatus = pageStatuses.find((p) => p.url === url);
                  const isSelected = selectedUrls.has(url);

                  return (
                    <motion.div
                      key={url}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                        isSelected ? "bg-indigo-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUrlSelection(url)}
                        disabled={isAuditingPages}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-gray-700 hover:text-indigo-600 truncate flex items-center gap-1"
                      >
                        {getSafePathname(url)}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>

                      {pageStatus && (
                        <div className="flex-shrink-0">
                          {pageStatus.status === "pending" && (
                            <Badge variant="info">Pending</Badge>
                          )}
                          {pageStatus.status === "auditing" && (
                            <Badge variant="moderate">
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Auditing
                            </Badge>
                          )}
                          {pageStatus.status === "completed" && (
                            <div className="flex items-center gap-2">
                              <Badge variant="success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Done
                              </Badge>
                              {activeReportUrl === url ? (
                                <Badge variant="info">Viewing</Badge>
                              ) : (
                                <button
                                  onClick={() => onViewReport?.(url)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                                >
                                  View Report
                                </button>
                              )}
                            </div>
                          )}
                          {pageStatus.status === "failed" && (
                            <Badge variant="critical">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <p className="p-4 text-sm text-gray-500 text-center">
                  No internal pages found.
                </p>
              )}
            </div>

            {selectedUrls.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg"
              >
                <p className="text-sm text-indigo-700">
                  <strong>{selectedUrls.size}</strong> page(s) selected for audit
                </p>
                <button
                  onClick={auditSelectedPages}
                  disabled={isAuditingPages}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isAuditingPages ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Auditing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Audit Selected Pages
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>
        )}

        {!crawlerMutation.data && !crawlerMutation.isPending && !crawlerMutation.isError && (
          <div className="py-8 text-center text-gray-500">
            <Compass className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Click "Discover Pages" to find all internal links on this website</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
