"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditSchema, type AuditFormValues } from "@/schemas/auditSchema";
import { Search, Shield, Zap, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

interface AuditFormProps {
  onSubmit: (data: AuditFormValues) => void;
  isPending: boolean;
}

export function AuditForm({ onSubmit, isPending }: AuditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: { url: "" },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            {...register("url")}
            type="text"
            placeholder="https://example.com"
            disabled={isPending}
            className={cn(
              "w-full pl-14 pr-36 py-5 text-lg rounded-full transition-all duration-300",
              "bg-white border-2 border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
              "focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
              "disabled:bg-slate-50 disabled:cursor-not-allowed",
              errors.url ? "border-rose-300 focus:border-rose-300 focus:ring-rose-50" : ""
            )}
          />
          <div className="absolute inset-y-2 right-2 flex items-center">
            <motion.button
              type="submit"
              disabled={isPending}
              whileHover={{ scale: isPending ? 1 : 1.02 }}
              whileTap={{ scale: isPending ? 1 : 0.98 }}
              className={cn(
                "h-full px-6 font-medium rounded-full transition-all duration-200 flex items-center gap-2",
                isPending
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
              )}
            >
              {isPending ? "Auditing..." : "Audit"}
              {!isPending && <ArrowRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {errors.url && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-500 text-sm flex items-center justify-center gap-1 mt-2"
          >
            {errors.url.message}
          </motion.p>
        )}
      </form>

      <div className="flex items-center justify-center gap-8 mt-12">
        {[
          { icon: Zap, label: "Performance" },
          { icon: Shield, label: "Accessibility" },
          { icon: Globe, label: "SEO & Best Practices" },
        ].map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.3 }}
            className="flex items-center gap-2 text-slate-500 font-light text-sm"
          >
            <feature.icon className="w-4 h-4 text-slate-400" />
            <span>{feature.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}