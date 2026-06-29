"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuditForm } from "@/components/AuditForm";
import { AuditResults } from "@/components/results/AuditResult";
import { CrawlerSection } from "@/components/CrawlerSection";
import { LoadingOverlay } from "@/components/ui/LoadingSpinner";
import { useAuditMutation } from "@/hooks/useAudit";
import { pingServer } from "@/lib/api";
import type { AuditFormValues, AuditResponse } from "@/schemas/auditSchema";
import { ArrowLeft, ScanEye, Code2, Wifi, WifiOff } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <div className="absolute w-[60vw] h-[60vw] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/4" />
        <div className="absolute w-[50vw] h-[50vw] bg-violet-50 rounded-full blur-[100px] translate-x-1/4" />
      </div>

      <AnimatePresence>
        {auditMutation.isPending && (
          <LoadingOverlay message={loadingMessage} />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 ring-1 ring-indigo-100">
              <ScanEye size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 tracking-tight">AccessGuard</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {serverOnline === false && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-medium bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                <WifiOff className="w-3.5 h-3.5" />
                Offline
              </div>
            )}
            {serverOnline === true && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <Wifi className="w-3.5 h-3.5" />
                Online
              </div>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full border border-slate-200 shadow-sm"
            >
              <Code2 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {serverOnline === false && !auditMutation.isPending && !hasResults && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3 shadow-sm"
          >
            <WifiOff className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">Backend Server Not Reachable</p>
              <p className="text-rose-600/80 mt-0.5">
                Ensure your backend is running on <code className="bg-rose-100/50 px-1.5 py-0.5 rounded font-mono text-xs">http://localhost:3000</code>
              </p>
            </div>
          </motion.div>
        )}

        {!hasResults ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl w-full"
            >
              <h2 className="text-4xl font-medium tracking-tight text-slate-900 mb-4">
                Audit your platform
              </h2>
              <p className="text-slate-500 mb-10 text-lg font-light">
                Enter a URL to generate a comprehensive accessibility and performance report.
              </p>
              
              <div className="w-full">
                <AuditForm onSubmit={handleSubmit} isPending={auditMutation.isPending} />
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 flex-wrap pb-4 border-b border-slate-200">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                New Audit
              </button>
              {activeReportUrl && (
                <>
                  <button
                    onClick={() => setActiveReportUrl("")}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors text-sm px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100"
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

            <div className="pt-8 border-t border-slate-200">
              <CrawlerSection
                baseUrl={auditedUrl}
                onPageAudited={handlePageAudited}
                onViewReport={setActiveReportUrl}
                activeReportUrl={activeReportUrl}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
