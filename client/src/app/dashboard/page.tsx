"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuditForm } from "@/components/AuditForm";
import { AuditResults } from "@/components/results/AuditResult";
import { CrawlerSection } from "@/components/CrawlerSection";
import { LoadingOverlay } from "@/components/ui/LoadingSpinner";
import { useAuditMutation } from "@/hooks/useAudit";
import api, { pingServer } from "@/lib/api";
import type { AuditFormValues, AuditResponse } from "@/schemas/auditSchema";
import { ArrowLeft, ScanEye, Code2, Wifi, WifiOff, LogOut, Plus, GitBranch, ExternalLink, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function DashboardPage() {
  const auditMutation = useAuditMutation();
  const { user, logout } = useAuth();
  const [auditedUrl, setAuditedUrl] = useState<string>("");
  const [auditedPages, setAuditedPages] = useState<Map<string, AuditResponse>>(new Map());
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [activeReportUrl, setActiveReportUrl] = useState<string>("");

  const normalizeUrl = (u: string) => u.replace(/\/+$/, "");

  const activeReport = activeReportUrl && auditedPages.has(normalizeUrl(activeReportUrl))
    ? auditedPages.get(normalizeUrl(activeReportUrl))!
    : auditMutation.data;

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
          const res = await api.get('/projects');
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

  const handleSubmit = (data: AuditFormValues) => {
    setAuditedUrl(data.url);
    auditMutation.mutate(data.url);
  };

  const handleRerun = () => {
    if (auditedUrl) {
      auditMutation.mutate(auditedUrl);
    }
  };

  const handleReset = () => {
    setAuditedUrl("");
    setAuditedPages(new Map());
    setActiveReportUrl("");
    auditMutation.reset();
  };

  const handlePageAudited = (url: string, data: AuditResponse) => {
    setAuditedPages((prev) => {
      const newMap = new Map(prev);
      newMap.set(normalizeUrl(url), data);
      return newMap;
    });
  };

  const hasResults = auditMutation.isSuccess && !!auditMutation.data;

  // Safe hostname extraction for loading message
  let loadingMessage = "Auditing...";
  try {
    if (auditedUrl) loadingMessage = `Auditing ${new URL(auditedUrl).hostname}...`;
  } catch {
    loadingMessage = "Auditing...";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <div className="absolute w-[60vw] h-[60vw] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/4" />
        <div className="absolute w-[50vw] h-[50vw] bg-violet-50 rounded-full blur-[100px] translate-x-1/4" />
      </div>

      <AnimatePresence>
        {auditMutation.isPending && (
          <LoadingOverlay message={loadingMessage} />
        )}
      </AnimatePresence>

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
        {serverOnline === false && !auditMutation.isPending && !hasResults && (
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

        {!hasResults ? (
          <>
            {/* Projects Section */}
            {!auditMutation.isPending && (
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
                    {projects.map((project: any, index: number) => (
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
                              <h3 className="font-medium text-slate-900 line-clamp-1" title={project.githubRepo}>
                                {project.githubRepo.split('/').pop()?.replace('.git', '') || 'Project'}
                              </h3>
                              <p className="text-xs text-slate-500">{project.frontendLang} • {project.backendLang}</p>
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
                          
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                            
                            <button
                              onClick={() => {
                                setAuditedUrl(project.prodLink);
                                auditMutation.mutate(project.prodLink);
                              }}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              Run Audit
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            <div className="py-16 flex flex-col items-center justify-center text-center mt-12 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-50/50 pointer-events-none rounded-[3rem]" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-3xl w-full relative z-10 bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 md:p-12"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 border border-indigo-100 shadow-sm">
                <ScanEye className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 mb-4">
                Audit your platform
              </h2>
              <p className="text-slate-500 mb-10 text-lg font-light max-w-xl mx-auto">
                Enter a URL to generate a comprehensive accessibility and performance report powered by our intelligence engine.
              </p>
              
              <div className="w-full relative">
                <AuditForm onSubmit={handleSubmit} isPending={auditMutation.isPending} />
              </div>
            </motion.div>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 flex-wrap pb-4 border-b border-slate-200">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                New Audit
              </button>
              {activeReportUrl && (
                <>
                  <button
                    onClick={() => setActiveReportUrl("")}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors text-sm px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100"
                  >
                    Back to Main Report
                  </button>
                </>
              )}
            </div>

            {activeReport && (
              <AuditResults
                data={activeReport}
                onRerun={handleRerun}
                isRerunning={auditMutation.isPending}
              />
            )}

            <div className="pt-8 border-t border-slate-200">
              <CrawlerSection
                baseUrl={auditedUrl}
                onPageAudited={handlePageAudited}
                onViewReport={setActiveReportUrl}
                activeReportUrl={activeReportUrl}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
