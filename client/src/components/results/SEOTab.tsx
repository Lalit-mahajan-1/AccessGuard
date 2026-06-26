import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { Card, CardContent } from "@/components/ui/Card";
import { Award, Star, AlertTriangle } from "lucide-react";
import type { LighthouseSuggestionItem } from "@/schemas/auditSchema";

interface SEOTabProps {
  scores?: {
    performance?: number | null;
    accessibility?: number | null;
    bestPractices?: number | null;
    seo?: number | null;
  };
  suggestions?: {
    trustAndSafety?: LighthouseSuggestionItem[];
  };
}

export function SEOTab({ scores, suggestions }: SEOTabProps) {
  const bestPracticesScore = scores?.bestPractices ?? 0;
  const seoScore = scores?.seo ?? 0;

  const getGrade = (score: number) => {
    const val = score <= 1 ? score * 100 : score;
    if (val >= 90) return "A";
    if (val >= 80) return "B";
    if (val >= 70) return "C";
    if (val >= 50) return "D";
    return "F";
  };

  const cleanText = (text?: string) => text?.replace(/\[(.*?)\]\(.*?\)/g, '$1') ?? "";

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <ScoreGauge score={Math.round(seoScore * 100)} label="Lighthouse SEO Score" size="lg" />
          <div className="mt-4 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Search Engine Optimization</span>
            <p className="text-sm font-bold text-slate-800 mt-1">
              Grade: {getGrade(seoScore)}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center py-8">
          <ScoreGauge score={Math.round(bestPracticesScore * 100)} label="Best Practices Score" size="lg" />
          <div className="mt-4 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Security & Reliability</span>
            <p className="text-sm font-bold text-slate-800 mt-1">
              Grade: {getGrade(bestPracticesScore)}
            </p>
          </div>
        </Card>
      </div>

      {/* Trust & Safety Warnings Section */}
      {suggestions?.trustAndSafety && suggestions.trustAndSafety.length > 0 && (
        <Card className="border-amber-100">
          <CardContent className="pt-6">
            <h3 className="text-md font-bold text-amber-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Security & Trust Warnings
            </h3>
            <div className="space-y-3">
              {suggestions.trustAndSafety.map((issue, idx) => (
                <div key={idx} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-sm">
                  <h4 className="font-bold text-slate-800">{issue.title}</h4>
                  <p className="text-slate-600 mt-1">{cleanText(issue.description)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            SEO & Best Practices Standards
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Search Crawler Friendliness</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ensures search engines can crawl, index, and render pages properly. Verify that your pages contain structured meta tags, description tag, title tag, viewport tags, and appropriate canonical tags.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Modern Web Security Standards</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  AccessGuard verifies that the target site is served over secure HTTPS protocols, implements HSTS policies to enforce secure communication, and does not run libraries with known vulnerabilities.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
