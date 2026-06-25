"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditSchema, type AuditFormValues } from "@/schemas/auditSchema";
import { Search, Shield, Zap, Globe } from "lucide-react";
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
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">AccessGuard</h1>
        <p className="text-gray-600 text-lg">Web Performance & Accessibility Auditor</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Zap, label: "Performance", color: "text-amber-500" },
          { icon: Shield, label: "Accessibility", color: "text-indigo-500" },
          { icon: Globe, label: "SEO", color: "text-emerald-500" },
        ].map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <feature.icon className={cn("w-6 h-6 mb-2", feature.color)} />
            <span className="text-sm font-medium text-gray-700">{feature.label}</span>
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            {...register("url")}
            type="text"
            placeholder="https://example.com"
            disabled={isPending}
            className={cn(
              "w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
              "disabled:bg-gray-50 disabled:cursor-not-allowed",
              errors.url ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
            )}
          />
        </div>

        {errors.url && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-red-500 text-sm flex items-center gap-1"
          >
            <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
            {errors.url.message}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={isPending}
          whileHover={{ scale: isPending ? 1 : 1.01 }}
          whileTap={{ scale: isPending ? 1 : 0.99 }}
          className={cn(
            "w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
            isPending
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
          )}
        >
          {isPending ? "Running Audit..." : <><Shield className="w-5 h-5" /> Run Full Audit</>}
        </motion.button>
      </form>
    </motion.div>
  );
}