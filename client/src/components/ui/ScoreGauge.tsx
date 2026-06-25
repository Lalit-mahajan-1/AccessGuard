import * as React from "react";
import { cn } from "@/utils/cn";

export interface ScoreGaugeProps {
  score: number; // 0-1 or 0-100
  label: string;
  size?: "sm" | "lg";
  className?: string;
}

export function ScoreGauge({ score, label, size = "sm", className }: ScoreGaugeProps) {
  const rawScore = score <= 1 && score > 0 ? score * 100 : score;
  const normalizedScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Determine color category
  let colorClass = "text-rose-500 stroke-rose-500";
  let bgStrokeClass = "stroke-rose-100";
  if (normalizedScore >= 90) {
    colorClass = "text-emerald-500 stroke-emerald-500";
    bgStrokeClass = "stroke-emerald-100";
  } else if (normalizedScore >= 50) {
    colorClass = "text-amber-500 stroke-amber-500";
    bgStrokeClass = "stroke-amber-100";
  }

  const dimensions = size === "lg" ? { size: 120, strokeWidth: 10, radius: 50, fontSize: "text-3xl font-extrabold" } : { size: 70, strokeWidth: 6, radius: 28, fontSize: "text-lg font-bold" };

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: dimensions.size, height: dimensions.size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${dimensions.size} ${dimensions.size}`}>
          {/* Background track */}
          <circle
            className={bgStrokeClass}
            strokeWidth={dimensions.strokeWidth}
            fill="transparent"
            r={dimensions.radius}
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
          />
          {/* Active progress track */}
          <circle
            className={cn("transition-all duration-500 ease-out", colorClass)}
            strokeWidth={dimensions.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={dimensions.radius}
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
          />
        </svg>
        {/* Centered Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-slate-900", dimensions.fontSize)}>
            {normalizedScore}
          </span>
        </div>
      </div>
      <span className={cn("text-xs font-semibold text-slate-600 text-center max-w-[100px]", size === "lg" ? "text-sm font-bold" : "")}>
        {label}
      </span>
    </div>
  );
}
