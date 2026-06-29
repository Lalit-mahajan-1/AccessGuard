"use client";

import { useRouter } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500/30">
      <LandingPage 
        onRunAudit={() => router.push("/dashboard")}
      />
    </div>
  );
}
