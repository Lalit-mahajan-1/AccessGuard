import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Terminal, ShieldAlert } from "lucide-react";

interface ConsoleLog {
  source: string;
  level: "error" | "warning" | "info" | "log";
  text: string;
}

interface ConsoleTabProps {
  logs?: {
    total: number;
    errors: number;
    warnings: number;
    logs: ConsoleLog[];
  };
}

export function ConsoleTab({ logs }: ConsoleTabProps) {
  const items = logs?.logs || [];
  const errors = logs?.errors ?? 0;
  const warnings = logs?.warnings ?? 0;

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            Console Output Summary
          </h3>
          <div className="flex gap-4">
            <div className="flex-1 p-4 rounded-xl border border-slate-100 bg-red-50/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Errors
              </span>
              <span className="text-2xl font-black text-red-700">{errors}</span>
            </div>
            <div className="flex-1 p-4 rounded-xl border border-slate-100 bg-amber-50/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Warnings
              </span>
              <span className="text-2xl font-black text-amber-700">{warnings}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-md font-bold text-slate-900 mb-4">Console Message History</h3>

          {items.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p className="font-semibold text-slate-700">No console logs recorded.</p>
              <p className="text-sm mt-1">Excellent! Clean runtime environment without any console.error or exceptions.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 font-mono text-xs max-h-[400px] overflow-y-auto bg-slate-950 text-slate-200">
              {items.map((log, idx) => {
                const isError = log.level === "error";
                const isWarning = log.level === "warning";

                return (
                  <div key={idx} className="p-3 flex items-start gap-3 hover:bg-slate-900/50">
                    <span className="flex-shrink-0 mt-0.5">
                      {isError ? (
                        <Badge variant="critical" className="font-bold py-0 text-[9px] uppercase">Error</Badge>
                      ) : isWarning ? (
                        <Badge variant="moderate" className="font-bold py-0 text-[9px] uppercase">Warn</Badge>
                      ) : (
                        <Badge variant="info" className="font-bold py-0 text-[9px] uppercase">Info</Badge>
                      )}
                    </span>
                    <div className="flex-1">
                      <p className={isError ? "text-red-400" : isWarning ? "text-amber-300" : "text-slate-300"}>
                        {log.text}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Source: {log.source || "unknown"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
