"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AuditForm } from "@/components/AuditForm";
import { AuditResults } from "@/components/results/AuditResult";
import { CrawlerSection } from "@/components/CrawlerSection";
import { LoadingOverlay } from "@/components/ui/LoadingSpinner";
import { useAuditMutation } from "@/hooks/useAudit";
import { pingServer } from "@/lib/api";
import type { AuditFormValues, AuditResponse } from "@/schemas/auditSchema";
import { ArrowLeft, Shield, Code2, Wifi, WifiOff } from "lucide-react";

export default function DashboardPage() {
  const auditMutation = useAuditMutation();
  const [auditedUrl, setAuditedUrl] = useState<string>("");
  const [auditedPages, setAuditedPages] = useState<Map<string, AuditResponse>>(new Map());
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [activeReportUrl, setActiveReportUrl] = useState<string>("");

  const normalizeUrl = (u: string) => u.replace(/\/+$/, "");

  const activeReport = activeReportUrl && auditedPages.has(normalizeUrl(activeReportUrl))
    ? auditedPages.get(normalizeUrl(activeReportUrl))!
    : auditMutation.data;

  // Check if backend is reachable on mount
  useEffect(() => {
    pingServer().then((ok) => {
      setServerOnline(ok);
      if (!ok) {
        console.error("[Frontend] Backend server is NOT reachable. Make sure it's running on the correct port.");
      }
    });
  }, []);

  const handleSubmit = (data: AuditFormValues) => {
    setAuditedUrl(data.url);
    auditMutation.mutate(data.url);
  };

  const handleRerun = () => {
    if (auditedUrl) {
      auditMutation.mutate(auditedUrl);
    }
  };

  const handleReset = () => {
    setAuditedUrl("");
    setAuditedPages(new Map());
    setActiveReportUrl("");
    auditMutation.reset();
  };

  const handlePageAudited = (url: string, data: AuditResponse) => {
    setAuditedPages((prev) => {
      const newMap = new Map(prev);
      newMap.set(normalizeUrl(url), data);
      return newMap;
    });
  };

  const hasResults = auditMutation.isSuccess && !!auditMutation.data;

  // Safe hostname extraction for loading message
  let loadingMessage = "Auditing...";
  try {
    if (auditedUrl) loadingMessage = `Auditing ${new URL(auditedUrl).hostname}...`;
  } catch {
    loadingMessage = "Auditing...";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <AnimatePresence>
        {auditMutation.isPending && (
          <LoadingOverlay message={loadingMessage} />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">AccessGuard</h1>
              <p className="text-xs text-gray-500">Performance & Accessibility</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {serverOnline === false && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                <WifiOff className="w-3.5 h-3.5" />
                Server Offline
              </div>
            )}
            {serverOnline === true && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <Wifi className="w-3.5 h-3.5" />
                Server Online
              </div>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Code2 className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {serverOnline === false && !auditMutation.isPending && !hasResults && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <p className="font-semibold">Backend Server Not Reachable</p>
            <p className="mt-1">
              Make sure your backend is running on the correct port and CORS is enabled.
              Default: <code className="bg-red-100 px-1.5 py-0.5 rounded">http://localhost:3000</code>
            </p>
          </div>
        )}

        {!hasResults ? (
          <div className="py-12">
            <AuditForm onSubmit={handleSubmit} isPending={auditMutation.isPending} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Audit Another URL
              </button>
              {activeReportUrl && (
                <>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setActiveReportUrl("")}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-950 font-bold transition-colors cursor-pointer"
                  >
                    Back to Main Report
                  </button>
                </>
              )}
            </div>

            {activeReport && (
              <AuditResults
                data={activeReport}
                onRerun={handleRerun}
                isRerunning={auditMutation.isPending}
              />
            )}

            <CrawlerSection
              baseUrl={auditedUrl}
              onPageAudited={handlePageAudited}
              onViewReport={setActiveReportUrl}
              activeReportUrl={activeReportUrl}
            />
          </div>
        )}
      </main>
    </div>
  );
}
