"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api, { pingServer } from "@/lib/api";
import { ScanEye, Code2, Wifi, WifiOff, LogOut, Plus, GitBranch, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Check if backend is reachable on mount
  useEffect(() => {
    pingServer().then((ok) => {
      setServerOnline(ok);
      if (!ok) {
        console.error("[Frontend] Backend server is NOT reachable. Make sure it's running on the correct port.");
      }
    });
  }, []);

  // Fetch projects
  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        try {
          const res = await api.get('/repo');
          if (res.data.success) {
            setProjects(res.data.projects);
          }
        } catch (error) {
          console.error("Failed to fetch projects", error);
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <div className="absolute w-[60vw] h-[60vw] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/4" />
        <div className="absolute w-[50vw] h-[50vw] bg-violet-50 rounded-full blur-[100px] translate-x-1/4" />
      </div>

      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 ring-1 ring-indigo-100">
              <ScanEye size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 tracking-tight">AccessGuard</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {serverOnline === false && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-medium bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                <WifiOff className="w-3.5 h-3.5" />
                Offline
              </div>
            )}
            {serverOnline === true && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <Wifi className="w-3.5 h-3.5" />
                Online
              </div>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full border border-slate-200 shadow-sm"
            >
              <Code2 className="w-4 h-4" />
            </a>

            {user && (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                {/* User Avatar Circle */}
                <div 
                  title={user.name || user.email}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-semibold text-sm shadow-sm select-none transition-colors duration-200 cursor-default"
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50/50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 transition-all shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {serverOnline === false && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3 shadow-sm"
          >
            <WifiOff className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">Backend Server Not Reachable</p>
              <p className="text-rose-600/80 mt-0.5">
                Ensure your backend is running on <code className="bg-rose-100/50 px-1.5 py-0.5 rounded font-mono text-xs">http://localhost:3000</code>
              </p>
            </div>
          </motion.div>
        )}

        {/* Projects Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium tracking-tight text-slate-900">Your Projects</h2>
            <Link
              href="/projects/new"
              className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </Link>
          </div>
          
          {loadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white/50 backdrop-blur border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white/50 backdrop-blur border border-slate-200 rounded-2xl">
              <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No projects yet</h3>
              <p className="text-slate-500 mb-4">Connect a repository to get started with automated auditing.</p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Connect Repository
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any, index: number) => {
                const isMonorepo = project.meta?.type === "monorepo";
                const subProjects = project.meta?.projects || [];
                const frameworks = subProjects.map((p: any) => p.framework).filter(Boolean);
                const uniqueFrameworks = Array.from(new Set(frameworks));
                const frameworkLabel = uniqueFrameworks.length > 0 ? uniqueFrameworks.join(", ") : "Vanilla JS";
                const metaLabel = `${isMonorepo ? "Monorepo" : "Single Project"} • ${frameworkLabel}`;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    key={project.id} 
                    className="bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-indigo-300 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <GitBranch className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 line-clamp-1 text-sm md:text-base" title={project.githubRepo}>
                            {project.githubRepo.split('/').pop()?.replace('.git', '') || 'Project'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">{metaLabel}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        <a href={project.prodLink} target="_blank" rel="noreferrer" className="hover:text-indigo-600 truncate">
                          {project.prodLink.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl transition-all shadow-sm w-full text-center"
                        >
                          View Details & Audits
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
