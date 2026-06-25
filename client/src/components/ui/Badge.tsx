import * as React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "critical" | "moderate" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50/80",
    critical: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50/80",
    moderate: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50/80",
    info: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50/80",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
