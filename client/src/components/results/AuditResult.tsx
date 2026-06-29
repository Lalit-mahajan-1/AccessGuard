"use client";

import { motion } from "framer-motion";
import { ExternalLink, RefreshCw, Clock, Zap, Shield, Terminal, Globe, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { PerformanceTab } from "./PerformanceTab";
import { AccessibilityTab } from "./AccessibilityTab";
import { ConsoleTab } from "./ConsoleTab";
import { NetworkTab } from "./NetworkTab";
import { SEOTab } from "./SEOTab";
import type { AuditResponse } from "@/schemas/auditSchema";
import { cn } from "@/utils/cn";

interface AuditResultsProps {
  data: AuditResponse;
  onRerun: () => void;
  isRerunning: boolean;
}

export function AuditResults({ data, onRerun, isRerunning }: AuditResultsProps) {
  const lighthouseScores = data.lighthouse?.scores;
  const analyzeData = data.analyze;

  const scores = [
    lighthouseScores?.performance,
    lighthouseScores?.accessibility,
    lighthouseScores?.bestPractices,
    lighthouseScores?.seo,
  ].filter((s): s is number => s !== undefined && s !== null).map((s) => Math.round(s * 100));

  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Report</h2>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 text-sm mt-1 font-medium"
          >
            {data.url} <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {data.timestamp && (
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-2 font-light">
              <Clock className="w-3.5 h-3.5" /> Audited: {new Date(data.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={onRerun}
          disabled={isRerunning}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl transition-all disabled:opacity-50 font-medium text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRerunning ? "animate-spin" : ""}`} />
          {isRerunning ? "Running..." : "Re-run Audit"}
        </button>
      </div>

      {/* Bento Grid layout for scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50" />
          <h3 className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider relative z-10">Overall Score</h3>
          <div className="relative z-10 scale-125 my-4">
            <ScoreGauge score={overallScore} label="" size="lg" />
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { score: lighthouseScores?.performance, label: "Performance", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
            { score: lighthouseScores?.accessibility, label: "Accessibility", icon: Shield, color: "text-indigo-500", bg: "bg-indigo-50" },
            { score: lighthouseScores?.bestPractices, label: "Best Practices", icon: Search, color: "text-sky-500", bg: "bg-sky-50" },
            { score: lighthouseScores?.seo, label: "SEO", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-50" },
          ].map((metric, i) => (
             <div key={metric.label} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:border-slate-300 transition-colors">
               <div className={cn("absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-50 transition-transform group-hover:scale-150", metric.bg)} />
               <metric.icon className={cn("w-6 h-6 mb-4 relative z-10", metric.color)} />
               {metric.score !== undefined && metric.score !== null ? (
                 <>
                   <span className="text-3xl font-bold text-slate-900 relative z-10">{Math.round(metric.score * 100)}</span>
                   <span className="text-xs font-medium text-slate-500 mt-2 text-center relative z-10">{metric.label}</span>
                 </>
               ) : (
                 <span className="text-sm text-slate-400 relative z-10">N/A</span>
               )}
             </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <Tabs defaultValue="performance" className="w-full">
          <div className="border-b border-slate-100 px-2 pt-2 bg-slate-50/50">
            <TabsList className="flex flex-wrap gap-2 bg-transparent justify-start">
              <TabsTrigger value="performance" icon={<Zap className="w-4 h-4" />} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl rounded-b-none px-6 py-3 data-[state=active]:text-indigo-600">Performance</TabsTrigger>
              <TabsTrigger value="accessibility" icon={<Shield className="w-4 h-4" />} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl rounded-b-none px-6 py-3 data-[state=active]:text-indigo-600">Accessibility</TabsTrigger>
              <TabsTrigger value="console" icon={<Terminal className="w-4 h-4" />} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl rounded-b-none px-6 py-3 data-[state=active]:text-indigo-600">Console</TabsTrigger>
              <TabsTrigger value="network" icon={<Globe className="w-4 h-4" />} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl rounded-b-none px-6 py-3 data-[state=active]:text-indigo-600">Network</TabsTrigger>
              <TabsTrigger value="seo" icon={<Search className="w-4 h-4" />} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-xl rounded-b-none px-6 py-3 data-[state=active]:text-indigo-600">SEO & Best Practices</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 md:p-8">
            <TabsContent value="performance">
              <PerformanceTab
                metrics={analyzeData?.performanceMetrics}
                lighthouseScore={lighthouseScores?.performance}
              />
            </TabsContent>

            <TabsContent value="accessibility">
              <AccessibilityTab
                violations={analyzeData?.accessibility}
                lighthouseScore={lighthouseScores?.accessibility}
              />
            </TabsContent>

            <TabsContent value="console">
              <ConsoleTab logs={analyzeData?.consoleLogs} />
            </TabsContent>

            <TabsContent value="network">
              <NetworkTab requests={analyzeData?.networkRequests} />
            </TabsContent>

            <TabsContent value="seo">
              <SEOTab scores={lighthouseScores} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
}
