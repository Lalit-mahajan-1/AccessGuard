"use client";

import { motion } from "framer-motion";
import { ExternalLink, RefreshCw, Clock, Zap, Shield, Terminal, Globe, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { PerformanceTab } from "./PerformanceTab";
import { AccessibilityTab } from "./AccessibilityTab";
import { ConsoleTab } from "./ConsoleTab";
import { NetworkTab } from "./NetworkTab";
import { SEOTab } from "./SEOTab";
import type { AuditResponse } from "@/schemas/auditSchema";

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Results</h2>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
          >
            {data.url} <ExternalLink className="w-3 h-3" />
          </a>
          {data.timestamp && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> Audited: {new Date(data.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={onRerun}
          disabled={isRerunning}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRerunning ? "animate-spin" : ""}`} />
          Re-run Audit
        </button>
      </div>

      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <ScoreGauge score={overallScore} label="Overall Score" size="lg" />
            <div className="flex flex-wrap justify-center gap-6">
              {lighthouseScores?.performance !== undefined && lighthouseScores.performance !== null && (
                <ScoreGauge score={Math.round(lighthouseScores.performance * 100)} label="Performance" size="sm" />
              )}
              {lighthouseScores?.accessibility !== undefined && lighthouseScores.accessibility !== null && (
                <ScoreGauge score={Math.round(lighthouseScores.accessibility * 100)} label="Accessibility" size="sm" />
              )}
              {lighthouseScores?.bestPractices !== undefined && lighthouseScores.bestPractices !== null && (
                <ScoreGauge score={Math.round(lighthouseScores.bestPractices * 100)} label="Best Practices" size="sm" />
              )}
              {lighthouseScores?.seo !== undefined && lighthouseScores.seo !== null && (
                <ScoreGauge score={Math.round(lighthouseScores.seo * 100)} label="SEO" size="sm" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance">
        <TabsList className="flex-wrap">
          <TabsTrigger value="performance" icon={<Zap className="w-4 h-4" />}>Performance</TabsTrigger>
          <TabsTrigger value="accessibility" icon={<Shield className="w-4 h-4" />}>Accessibility</TabsTrigger>
          <TabsTrigger value="console" icon={<Terminal className="w-4 h-4" />}>Console</TabsTrigger>
          <TabsTrigger value="network" icon={<Globe className="w-4 h-4" />}>Network</TabsTrigger>
          <TabsTrigger value="seo" icon={<Search className="w-4 h-4" />}>SEO & Best Practices</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </motion.div>
  );
}
