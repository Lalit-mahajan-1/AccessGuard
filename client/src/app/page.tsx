"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuditForm } from "@/components/AuditForm";
import { AuditResults } from "@/components/results/AuditResult";
import { CrawlerSection } from "@/components/CrawlerSection";
import { LoadingOverlay } from "@/components/ui/LoadingSpinner";
import { useAuditMutation } from "@/hooks/useAudit";
import type { AuditFormValues, AuditResponse } from "@/schemas/auditSchema";
import { ArrowLeft, Shield, Code2 } from "lucide-react";

export default function DashboardPage() {
  const auditMutation = useAuditMutation();
  const [auditedUrl, setAuditedUrl] = useState<string>("");
  const [auditedPages, setAuditedPages] = useState<Map<string, AuditResponse>>(new Map());

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
    auditMutation.reset();
  };

  const handlePageAudited = (url: string, data: AuditResponse) => {
    setAuditedPages((prev) => {
      const newMap = new Map(prev);
      newMap.set(url, data);
      return newMap;
    });
  };

  const hasResults = auditMutation.isSuccess && auditMutation.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <AnimatePresence>
        {auditMutation.isPending && (
          <LoadingOverlay message={`Auditing ${new URL(auditedUrl).hostname}...`} />
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
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Code2 className="w-5 h-5" />
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!hasResults ? (
          <div className="py-12">
            <AuditForm onSubmit={handleSubmit} isPending={auditMutation.isPending} />
          </div>
        ) : (
          <div className="space-y-8">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Audit Another URL
            </button>

            <AuditResults
              data={auditMutation.data}
              onRerun={handleRerun}
              isRerunning={auditMutation.isPending}
            />

            <CrawlerSection
              baseUrl={auditedUrl}
              onPageAudited={handlePageAudited}
            />
          </div>
        )}
      </main>
    </div>
  );
}