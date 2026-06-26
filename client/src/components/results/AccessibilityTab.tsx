import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface AccessibilityViolation {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  description: string;
  help: string;
  wcag: string[];
  nodeCount: number;
  nodes: Array<{
    selector: string;
    html: string;
    failure: string;
  }>;
}

interface AccessibilityTabProps {
  violations?: {
    totalViolations: number;
    byImpact: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
    };
    violations: AccessibilityViolation[];
  };
  passes?: unknown;
  lighthouseScore?: number | null;
}

export function AccessibilityTab({ violations, lighthouseScore }: AccessibilityTabProps) {
  const items = violations?.violations || [];
  const byImpact = violations?.byImpact;

  const getImpactVariant = (impact: string) => {
    switch (impact) {
      case "critical":
        return "critical" as const;
      case "serious":
        return "critical" as const;
      case "moderate":
        return "moderate" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center py-6">
          <ScoreGauge score={Math.round((lighthouseScore ?? 0) * 100)} label="Lighthouse Accessibility" size="lg" />
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Issues Overview
            </h3>
            {byImpact ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl border border-slate-100 bg-red-50/50 text-center">
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Critical</span>
                  <p className="text-2xl font-black text-red-700 mt-1">{byImpact.critical}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-orange-50/50 text-center">
                  <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Serious</span>
                  <p className="text-2xl font-black text-orange-700 mt-1">{byImpact.serious}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-amber-50/50 text-center">
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Moderate</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{byImpact.moderate}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Minor</span>
                  <p className="text-2xl font-black text-slate-700 mt-1">{byImpact.minor}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No issues summary available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Accessibility Violations ({items.length})
        </h3>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">Excellent! No accessibility issues found.</p>
              <p className="text-sm mt-1">This page matches standard WCAG guidelines.</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item, idx) => (
            <Card key={item.id || idx}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-sm font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.id}
                      </span>
                      {item.help}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getImpactVariant(item.impact)} className="uppercase">
                      {item.impact}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {item.wcag?.map((rule) => (
                    <span
                      key={rule}
                      className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase"
                    >
                      {rule}
                    </span>
                  ))}
                </div>

                {item.nodes?.length > 0 && (
                  <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-100/50 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Info className="w-4 h-4 text-indigo-500" />
                      Affected Element DOM Code Snippets (Showing top {item.nodes.length})
                    </div>
                    <div className="divide-y divide-slate-100 font-mono text-xs">
                      {item.nodes.map((node, nodeIdx) => (
                        <div key={nodeIdx} className="p-4 space-y-2">
                          <div>
                            <span className="font-semibold text-indigo-600 block">Selector:</span>
                            <code className="text-slate-800 break-all">{node.selector}</code>
                          </div>
                          <div>
                            <span className="font-semibold text-rose-600 block">HTML:</span>
                            <code className="text-rose-800 break-all">{node.html}</code>
                          </div>
                          {node.failure && (
                            <div>
                              <span className="font-semibold text-amber-600 block">Fix Info:</span>
                              <p className="text-amber-800 text-xs italic">{node.failure}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
