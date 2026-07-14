"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft,
  GitBranch,
  ExternalLink,
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Trash2,
  Terminal,
  Layers,
  Code2,
  ListFilter,
  XCircle,
  Loader2,
  Play,
  Calendar,
  AlertCircle,
  Activity
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AuditResults } from "@/components/results/AuditResult";
import { LoadingOverlay } from "@/components/ui/LoadingSpinner";

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

// Recursively builds a tree from flat paths
function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const path of paths) {
    const parts = path.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFolder = i < parts.length - 1;

      let existingPath = currentLevel.find((v) => v.name === part);
      if (!existingPath) {
        existingPath = {
          name: part,
          path: currentPath,
          isFolder,
          children: [],
        };
        currentLevel.push(existingPath);
      }
      currentLevel = existingPath.children;
    }
  }

  const processNodes = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        node.isFolder = true;
        processNodes(node.children);
      }
    }
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  processNodes(root);
  return root;
}

// Tree Node UI Component
function FileNode({ node, level }: { node: TreeNode; level: number }) {
  const [isOpen, setIsOpen] = useState(level < 1); // Expand first level by default

  const handleToggle = () => {
    if (node.isFolder) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="select-none">
      <div
        onClick={handleToggle}
        style={{ paddingLeft: `${level * 16}px` }}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm transition-colors duration-150 cursor-pointer ${
          node.isFolder
            ? "hover:bg-slate-100/80 text-slate-700 font-medium"
            : "hover:bg-slate-50 text-slate-500 font-normal"
        }`}
      >
        {node.isFolder ? (
          <>
            <span className="text-slate-400">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="text-indigo-500">
              {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
            </span>
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <span className="text-slate-400">
              <File size={16} />
            </span>
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {node.isFolder && isOpen && node.children.length > 0 && (
        <div className="border-l border-slate-200/60 ml-3.5 pl-1.5 mt-0.5">
          {node.children.map((child) => (
            <FileNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [activeAudit, setActiveAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState("");

  // AI planning states
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<any[] | null>(null);
  const [planningError, setPlanningError] = useState("");

  const [searchDep, setSearchDep] = useState("");
  const [expandedDeps, setExpandedDeps] = useState<Record<string, boolean>>({});

  // Fetch project details and audits history
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const projectRes = await api.get(`/repo/${id}`);
          if (projectRes.data.success) {
            setProject(projectRes.data.project);
          } else {
            throw new Error(projectRes.data.error || "Failed to load project details");
          }

          const auditsRes = await api.get(`/repo/${id}/audits`);
          if (auditsRes.data.success) {
            setAudits(auditsRes.data.audits);
          }
        } catch (err: any) {
          setError(err.response?.data?.error || err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This will remove all stored metadata and audits.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await api.delete(`/repo/${id}`);
      if (res.data.success) {
        toast.success("Project deleted successfully");
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to delete project");
      setDeleting(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const res = await api.post(`/repo/${id}/audit`);
      if (res.data.success) {
        toast.success("Audit completed successfully!");
        setAudits((prev) => [res.data.audit, ...prev]);
        setActiveAudit(res.data.audit);
      } else {
        throw new Error(res.data.error || "Audit failed to run");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Audit execution encountered an error");
    } finally {
      setAuditing(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!activeAudit) return;
    setPlanning(true);
    setPlanningError("");
    setPlan(null);
    try {
      const res = await api.post(`/repo/${id}/audit/${activeAudit.id}/plan`);
      if (res.data.success) {
        setPlan(res.data.plan);
        toast.success("AI plan generated successfully!");
      } else {
        throw new Error(res.data.error || "Failed to generate plan");
      }
    } catch (err: any) {
      setPlanningError(err.response?.data?.error || err.message || "Failed to generate plan");
      toast.error("Failed to generate plan");
    } finally {
      setPlanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-light">Loading project analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Error Loading Project</h1>
        <p className="text-slate-500 max-w-md mb-8">{error || "Project was not found or is inaccessible."}</p>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  // Parse repo info
  const repoName = project.githubRepo.split("/").pop()?.replace(".git", "") || "Project";
  const isMonorepo = project.meta?.type === "monorepo";
  const modules = project.meta?.projects || [];
  const treeNodes = buildTree(project.tree || []);

  const toggleDepsExpand = (folder: string) => {
    setExpandedDeps((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (score >= 50) return "text-amber-500 bg-amber-50 border-amber-100";
    return "text-rose-500 bg-rose-50 border-rose-100";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden p-6 md:p-12">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <div className="absolute w-[60vw] h-[60vw] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/4" />
        <div className="absolute w-[50vw] h-[50vw] bg-violet-50 rounded-full blur-[100px] translate-x-1/4" />
      </div>

      <AnimatePresence>
        {auditing && (
          <LoadingOverlay message={`Auditing ${project.prodLink.replace(/^https?:\/\//, "")}... Running Lighthouse and Axe accessibility checks.`} />
        )}
        {planning && (
          <LoadingOverlay message="Querying local Ollama AI model to generate execution plan mapping findings to files..." />
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {activeAudit ? (
          // --- Dynamic Audit Report View ---
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 animate-in fade-in duration-300"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setActiveAudit(null);
                    setPlan(null);
                    setPlanningError("");
                  }}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold text-sm bg-white px-4 py-2 rounded-full shadow-sm w-fit"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Project Overview
                </button>

                <div className="text-sm text-slate-400 font-light flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Audited on {new Date(activeAudit.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={planning}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-750 px-5 py-2.5 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:bg-slate-300"
              >
                {planning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Code2 className="w-4 h-4" />
                    Generate Plan with AI
                  </>
                )}
              </button>
            </div>

            {planningError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-150 text-rose-700 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{planningError}</span>
              </div>
            )}

            {plan && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-md space-y-6"
              >
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-indigo-500" />
                      AI Action Plan
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Precise recommended fixes mapping to source files</p>
                  </div>
                  <button
                    onClick={() => setPlan(null)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const tasksList = Array.isArray(plan)
                      ? plan
                      : (plan && typeof plan === 'object'
                          ? (Object.values(plan).find((v) => Array.isArray(v)) || Object.values(plan))
                          : []);
                    return tasksList.map((task: any, index: number) => {
                      const getPriorityStyles = (priority: string) => {
                      switch (priority?.toLowerCase()) {
                        case "critical":
                          return "bg-rose-50 text-rose-600 border-rose-100";
                        case "high":
                          return "bg-amber-50 text-amber-600 border-amber-100";
                        case "medium":
                          return "bg-yellow-50 text-yellow-600 border-yellow-100";
                        default:
                          return "bg-slate-50 text-slate-600 border-slate-200";
                      }
                    };

                    const getTypeStyles = (type: string) => {
                      switch (type?.toLowerCase()) {
                        case "accessibility":
                          return "bg-indigo-50 text-indigo-600 border-indigo-100";
                        case "security":
                          return "bg-teal-50 text-teal-600 border-teal-100";
                        case "performance":
                          return "bg-cyan-50 text-cyan-600 border-cyan-100";
                        default:
                          return "bg-blue-50 text-blue-600 border-blue-100";
                      }
                    };

                    return (
                      <div
                        key={index}
                        className="border border-slate-150 hover:border-indigo-200 rounded-2xl p-5 bg-slate-50/20 hover:bg-white transition-all shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${getTypeStyles(task.type)}`}>
                              {task.type}
                            </span>
                            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${getPriorityStyles(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="font-semibold text-slate-800 text-sm md:text-base leading-snug">
                            {task.task}
                          </h4>

                          <p className="text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded truncate" title={task.file}>
                            📄 {task.file}
                          </p>
                        </div>

                        <div className="bg-indigo-950/5 border border-indigo-100/50 p-3.5 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">How to Fix</span>
                          <p className="text-xs text-slate-700 font-light leading-relaxed">
                            {task.fix}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
            )}

            <AuditResults
              data={activeAudit.response}
              onRerun={handleRunAudit}
              isRerunning={auditing}
            />
          </motion.div>
        ) : (
          // --- Main Project Overview Dashboard ---
          <>
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200/60 px-4 py-2 rounded-full shadow-sm w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-white bg-white hover:bg-rose-600 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 hover:border-rose-600 px-4 py-2 rounded-full shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>

            {/* Dashboard Header */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <GitBranch className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-medium tracking-tight text-slate-900">{repoName}</h1>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isMonorepo 
                        ? "bg-purple-50 text-purple-600 border-purple-100" 
                        : "bg-indigo-50 text-indigo-600 border-indigo-100"
                    }`}>
                      {isMonorepo ? "Monorepo" : "Single Project"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm font-light select-all">{project.githubRepo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={project.prodLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-5 py-3 rounded-2xl transition-all border border-slate-200 hover:border-indigo-200"
                >
                  Live Site
                  <ExternalLink size={16} />
                </a>

                <button
                  onClick={handleRunAudit}
                  disabled={auditing}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100"
                >
                  <Play size={16} className="fill-current" />
                  Run Audit
                </button>
              </div>
            </div>

            {/* Audit History Panel */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Accessibility & Performance Audits
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">Historical audit logs for this site</p>
                </div>

                <button
                  onClick={handleRunAudit}
                  className="text-xs font-semibold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 hover:border-indigo-600 px-3.5 py-2 rounded-xl transition-all"
                >
                  Run New Audit
                </button>
              </div>

              {audits.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-800 text-base mb-1">No Audits Run Yet</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mb-5 font-light">
                    Initiate an audit check to generate axe-core accessibility reports and lighthouse scores.
                  </p>
                  <button
                    onClick={handleRunAudit}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    <Play size={14} className="fill-current" /> Run First Audit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {audits.map((audit) => {
                    const lScore = audit.response?.lighthouse?.scores;
                    return (
                      <motion.div
                        key={audit.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-150 hover:border-indigo-200 rounded-2xl p-5 transition-all shadow-sm hover:shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
                        onClick={() => setActiveAudit(audit)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm md:text-base">
                              Audit Run
                            </h4>
                            <p className="text-slate-400 text-xs mt-0.5">
                              {new Date(audit.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {lScore ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-center">
                              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getScoreColor(lScore.performance)}`}>
                                Perf: {lScore.performance}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getScoreColor(lScore.accessibility)}`}>
                                Access: {lScore.accessibility}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getScoreColor(lScore.bestPractices)}`}>
                                BestPrac: {lScore.bestPractices}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getScoreColor(lScore.seo)}`}>
                                SEO: {lScore.seo}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Scores Unavailable</span>
                        )}

                        <div className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0">
                          View Detailed Report &rarr;
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* File Explorer (Left Panel) */}
              <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col max-h-[700px] overflow-hidden">
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-500" />
                    Repository Tree
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">Found {project.tree?.length || 0} source files</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                  {treeNodes.length > 0 ? (
                    treeNodes.map((node) => (
                      <FileNode key={node.path} node={node} level={0} />
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm py-4 italic">No files parsed.</p>
                  )}
                </div>
              </div>

              {/* Project Modules (Right Panel) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-500" />
                      Detected JavaScript Projects
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">Found {modules.length} build modules</p>
                  </div>

                  <div className="space-y-6">
                    {modules.map((mod: any, index: number) => {
                      const matchingDeps = mod.dependencies.filter((d: string) =>
                        d.toLowerCase().includes(searchDep.toLowerCase())
                      );

                      const isExpanded = !!expandedDeps[mod.folder];

                      return (
                        <div
                          key={mod.folder}
                          className="border border-slate-150 rounded-2xl p-6 bg-slate-50/50 hover:bg-white transition-all duration-200"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-3 border-b border-slate-100 pb-4 mb-4">
                            <div>
                              <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                                <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-sm font-medium border border-indigo-100">
                                  {mod.folder}
                                </span>
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 capitalize">
                                {mod.framework}
                              </span>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                {mod.packageManager}
                              </span>
                              {mod.hasTypeScript && (
                                <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-600 text-white font-mono">
                                  TS
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-5">
                            {/* Scripts Section */}
                            {mod.scripts && mod.scripts.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                  <Terminal className="w-3.5 h-3.5" />
                                  Executable Scripts
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {mod.scripts.map((script: string) => (
                                    <code
                                      key={script}
                                      className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md flex items-center gap-1"
                                    >
                                      {script}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Run commands list */}
                            {mod.runCommands && mod.runCommands.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Build/Test Commands
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {mod.runCommands.map((cmd: string) => (
                                    <code
                                      key={cmd}
                                      className="text-xs font-mono bg-indigo-950 text-indigo-200 px-2.5 py-1.5 rounded-lg border border-indigo-900"
                                    >
                                      {cmd}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dependencies Filter/Section */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                  <ListFilter className="w-3.5 h-3.5" />
                                  Dependencies ({mod.dependencies.length})
                                </h4>
                                <button
                                  onClick={() => toggleDepsExpand(mod.folder)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                  {isExpanded ? "Hide List" : "Show List"}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                  <input
                                    type="text"
                                    placeholder="Search dependencies..."
                                    value={searchDep}
                                    onChange={(e) => setSearchDep(e.target.value)}
                                    className="w-full p-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                                  />

                                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                                    {matchingDeps.length > 0 ? (
                                      matchingDeps.map((dep: string) => (
                                        <span
                                          key={dep}
                                          className="text-xs font-mono bg-white text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md"
                                        >
                                          {dep}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 text-xs italic">
                                        No matching dependencies found.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
