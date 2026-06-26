import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Zap, Cpu, Database, AlertTriangle, Info } from "lucide-react";
import type { LighthouseSuggestionItem } from "@/schemas/auditSchema";

interface PerformanceTabProps {
  metrics?: {
    webVitals?: {
      lcp_ms: number;
      fcp_ms: number;
      cls: number;
      longTasks: number;
    };
    runtime?: {
      domNodes: number;
      jsEventListeners: number;
      layoutCount: number;
      layoutDuration_s: number;
      scriptDuration_s: number;
      taskDuration_s: number;
    };
  };
  lighthouseScore?: number | null;
  suggestions?: {
    insights?: LighthouseSuggestionItem[];
    diagnostics?: LighthouseSuggestionItem[];
  };
}

export function PerformanceTab({ metrics, lighthouseScore, suggestions }: PerformanceTabProps) {
  const webVitals = metrics?.webVitals;
  const runtime = metrics?.runtime;

  const getLcpStatus = (val: number) => {
    if (val < 2500) return { label: "Good", variant: "success" as const };
    if (val < 4000) return { label: "Needs Improvement", variant: "moderate" as const };
    return { label: "Poor", variant: "critical" as const };
  };

  const getFcpStatus = (val: number) => {
    if (val < 1800) return { label: "Good", variant: "success" as const };
    if (val < 3000) return { label: "Needs Improvement", variant: "moderate" as const };
    return { label: "Poor", variant: "critical" as const };
  };

  const getClsStatus = (val: number) => {
    if (val < 0.1) return { label: "Good", variant: "success" as const };
    if (val < 0.25) return { label: "Needs Improvement", variant: "moderate" as const };
    return { label: "Poor", variant: "critical" as const };
  };

  // Helper to remove markdown links from Lighthouse text
  const cleanText = (text?: string) => text?.replace(/\[(.*?)\]\(.*?\)/g, '$1') ?? "";

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center py-6">
          <ScoreGauge score={Math.round((lighthouseScore ?? 0) * 100)} label="Lighthouse Performance" size="lg" />
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              Web Vitals (Field Metrics)
            </h3>
            {webVitals ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500">Largest Contentful Paint</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{(webVitals.lcp_ms / 1000).toFixed(2)}s</p>
                  <Badge variant={getLcpStatus(webVitals.lcp_ms).variant} className="mt-2">
                    {getLcpStatus(webVitals.lcp_ms).label}
                  </Badge>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500">First Contentful Paint</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{(webVitals.fcp_ms / 1000).toFixed(2)}s</p>
                  <Badge variant={getFcpStatus(webVitals.fcp_ms).variant} className="mt-2">
                    {getFcpStatus(webVitals.fcp_ms).label}
                  </Badge>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500">Cumulative Layout Shift</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{webVitals.cls.toFixed(3)}</p>
                  <Badge variant={getClsStatus(webVitals.cls).variant} className="mt-2">
                    {getClsStatus(webVitals.cls).label}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No Web Vitals data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🔥 THE NEW SUGGESTIONS/INSIGHTS SECTION 🔥 */}
      {suggestions?.insights && suggestions.insights.length > 0 && (
        <Card className="border-rose-100">
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-rose-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Optimization Opportunities (Why points were deducted)
            </h3>
            <div className="space-y-4">
              {suggestions.insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-rose-50/50 border border-rose-100 rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{insight.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{cleanText(insight.description)}</p>
                    </div>
                    {insight.displayValue && (
                      <Badge variant="critical" className="flex-shrink-0 whitespace-nowrap bg-rose-100 text-rose-800 border-rose-200">
                        {insight.displayValue}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Runtime / DOM details */}
      {runtime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" />
                JavaScript & Layout Execution
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Script Evaluation Time</span>
                  <span className="text-sm font-bold text-slate-900">{runtime.scriptDuration_s.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Layout & Reflow Execution Time</span>
                  <span className="text-sm font-bold text-slate-900">{runtime.layoutDuration_s.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total CPU Tasks Duration</span>
                  <span className="text-sm font-bold text-slate-900">{runtime.taskDuration_s.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600">Layout & Reflow Count</span>
                  <span className="text-sm font-bold text-slate-900">{runtime.layoutCount} reflows</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                DOM Complexity & Event Listeners
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">DOM Nodes Count</span>
                  <span className="text-sm font-bold text-slate-900">{runtime.domNodes} nodes</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">JS Event Listeners Registered</span>
                  <span className="text-sm font-bold text-slate-900">{runtime.jsEventListeners} listeners</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600">Blocking CPU Long Tasks</span>
                  <span className="text-sm font-bold text-slate-900">
                    <Badge variant={webVitals && webVitals.longTasks > 0 ? "critical" : "success"}>
                      {webVitals?.longTasks ?? 0} long tasks
                    </Badge>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diagnostics (Smaller performance issues) */}
      {suggestions?.diagnostics && suggestions.diagnostics.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-amber-700 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Diagnostics & Detailed Findings
            </h3>
            <div className="space-y-3 divide-y divide-slate-100">
              {suggestions.diagnostics.map((diag, idx) => (
                <div key={idx} className="pt-3 first:pt-0">
                  <h4 className="font-semibold text-slate-800 text-sm">{diag.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{cleanText(diag.description)}</p>
                  {diag.displayValue && <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded mt-2 inline-block text-slate-700">{diag.displayValue}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
