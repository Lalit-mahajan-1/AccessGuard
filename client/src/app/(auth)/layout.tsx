import React from 'react';
import Link from 'next/link';
import { ScanEye } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center mix-blend-screen opacity-50">
        <div className="absolute w-[60vw] h-[60vw] bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/4" />
        <div className="absolute w-[50vw] h-[50vw] bg-violet-500/10 rounded-full blur-[100px] translate-x-1/4" />
      </div>

      {/* Navbar Minimal */}
      <header className="absolute top-0 left-0 right-0 p-8 z-50 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-white/10 p-2 rounded-full text-white ring-1 ring-white/20 group-hover:bg-white/20 transition-colors">
            <ScanEye size={20} strokeWidth={1.5} />
          </div>
          <span className="font-semibold text-xl tracking-wide text-white">AccessGuard</span>
        </Link>
      </header>

      {/* Main Content Centered */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center z-50 pointer-events-none">
        <p className="text-white/40 text-xs font-light tracking-wide">
          Secured by Featherless AI Engine
        </p>
      </footer>
    </div>
  );
}
