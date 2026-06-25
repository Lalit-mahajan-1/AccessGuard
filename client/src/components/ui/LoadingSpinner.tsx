import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm mx-4 text-center border border-slate-100">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Running AccessGuard Audit</h3>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </motion.div>
  );
}
