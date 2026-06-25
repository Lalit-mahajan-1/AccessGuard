import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, ArrowDown, ShieldAlert, Clock, Database } from "lucide-react";

interface NetworkTabProps {
  requests?: {
    totalRequests: number;
    totalSizeKB: number;
    failedCount: number;
    failed: Array<{ url: string; status: number; error?: string }>;
    slowRequests: Array<{ url: string; ttfb: number; status: number }>;
    thirdPartyDomains: string[];
    byType: Record<string, { count: number; sizeKB: number }>;
    mainDocument: {
      status: number;
      protocol: string;
      server: string | null;
      ttfb: number | null;
      securityHeaders: {
        hsts: boolean;
        csp: boolean;
        xFrame: string | null;
        xContentType: string | null;
        referrerPolicy: string | null;
      };
    } | null;
  };
}

export function NetworkTab({ requests }: NetworkTabProps) {
  if (!requests) return <p className="text-sm text-slate-500 mt-4">No network data available.</p>;

  const {
    totalRequests,
    totalSizeKB,
    failedCount,
    failed,
    slowRequests,
    mainDocument,
  } = requests;

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Globe className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-500">Total HTTP Requests</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{totalRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <ArrowDown className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-500">Total Transferred Size</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{(totalSizeKB / 1024).toFixed(2)} MB</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-500">Failed Requests</span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              <Badge variant={failedCount > 0 ? "critical" : "success"} className="text-lg px-3">
                {failedCount}
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {mainDocument && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Main Document Security Headers & Protocol
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Connection Metadata</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Protocol</span>
                    <span className="font-semibold text-slate-800">{mainDocument.protocol}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Response Code</span>
                    <span className="font-semibold text-slate-800">{mainDocument.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Main Server</span>
                    <span className="font-semibold text-slate-800">{mainDocument.server || "unknown"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Time to First Byte (TTFB)</span>
                    <span className="font-semibold text-slate-800">{mainDocument.ttfb ? `${mainDocument.ttfb} ms` : "n/a"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Security Headers Audit</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Strict-Transport-Security (HSTS)</span>
                    <Badge variant={mainDocument.securityHeaders.hsts ? "success" : "critical"}>
                      {mainDocument.securityHeaders.hsts ? "Present" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Content-Security-Policy (CSP)</span>
                    <Badge variant={mainDocument.securityHeaders.csp ? "success" : "critical"}>
                      {mainDocument.securityHeaders.csp ? "Present" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">X-Frame-Options</span>
                    <span className="font-semibold text-slate-800">{mainDocument.securityHeaders.xFrame || "None"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {failed.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-rose-700 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Failed Requests Log
            </h3>
            <div className="space-y-2">
              {failed.map((fail, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-mono flex flex-col md:flex-row justify-between gap-2">
                  <span className="font-bold text-red-700 break-all">{fail.url}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="critical">Status: {fail.status || "failed"}</Badge>
                    {fail.error && <span className="text-red-500 italic">{fail.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {slowRequests.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Slow Network Responses (&gt;500ms TTFB)
            </h3>
            <div className="space-y-2">
              {slowRequests.map((slow, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono flex flex-col md:flex-row justify-between gap-2">
                  <span className="text-slate-700 break-all">{slow.url}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="moderate">TTFB: {slow.ttfb} ms</Badge>
                    <Badge variant="info">Status: {slow.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
