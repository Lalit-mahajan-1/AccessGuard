"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Rocket, Link2, Code2, Terminal, Plus, CheckCircle2, Server } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    githubRepo: "",
    prodLink: "",
    frontendLang: "",
    backendLang: "",
    runCommands: "", // comma-separated in UI, split before send
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await api.post('/projects', {
        ...form,
        runCommands: form.runCommands
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });

      const data = res.data;

      if (!data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden p-6 md:p-12">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <div className="absolute w-[60vw] h-[60vw] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/4" />
        <div className="absolute w-[50vw] h-[50vw] bg-violet-50 rounded-full blur-[100px] translate-x-1/4" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8 bg-white/60 backdrop-blur-xl border border-slate-200/60 px-4 py-2 rounded-full shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-8 md:p-10 border-b border-slate-200/50 bg-white/50">
            <h1 className="text-3xl font-medium tracking-tight text-slate-900 mb-2 flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
                <Rocket className="w-6 h-6" />
              </div>
              Add New Project
            </h1>
            <p className="text-slate-500 text-lg font-light pl-[3.25rem]">
              Connect your GitHub repository to enable automated accessibility auditing.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* GitHub Repo */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Code2 className="w-4 h-4 text-slate-400" />
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  name="githubRepo"
                  value={form.githubRepo}
                  onChange={handleChange}
                  required
                  placeholder="https://github.com/user/repo.git"
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm"
                />
              </div>

              {/* Production Link */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  Production URL
                </label>
                <input
                  type="url"
                  name="prodLink"
                  value={form.prodLink}
                  onChange={handleChange}
                  required
                  placeholder="https://yourapp.com"
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Frontend Language */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Server className="w-4 h-4 text-slate-400" />
                    Frontend Framework
                  </label>
                  <select
                    name="frontendLang"
                    value={form.frontendLang}
                    onChange={handleChange}
                    required
                    className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm appearance-none"
                  >
                    <option value="">Select framework</option>
                    <option value="react">React</option>
                    <option value="next">Next.js</option>
                    <option value="vue">Vue</option>
                    <option value="angular">Angular</option>
                    <option value="svelte">Svelte</option>
                    <option value="vanilla">Vanilla JS</option>
                  </select>
                </div>

                {/* Backend Language */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Server className="w-4 h-4 text-slate-400" />
                    Backend Language
                  </label>
                  <select
                    name="backendLang"
                    value={form.backendLang}
                    onChange={handleChange}
                    required
                    className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm appearance-none"
                  >
                    <option value="">Select language</option>
                    <option value="node">Node.js</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="ruby">Ruby</option>
                    <option value="java">Java</option>
                    <option value="php">PHP</option>
                  </select>
                </div>
              </div>

              {/* Run Commands */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  Run Commands <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  name="runCommands"
                  value={form.runCommands}
                  onChange={handleChange}
                  required
                  placeholder="npm install, npm run build, npm start"
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-medium transition-colors shadow-sm flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up container...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Deploy Project
                  </>
                )}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
                <div className="p-1 bg-rose-100 rounded-lg shrink-0">
                  <span className="text-rose-600">❌</span>
                </div>
                <div className="text-sm font-medium pt-0.5">{error}</div>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 overflow-hidden relative">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-medium tracking-tight text-emerald-900">
                    Project Deployed
                  </h3>
                </div>

                <div className="text-sm space-y-3 relative z-10 bg-white/60 p-4 rounded-xl border border-emerald-100 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700/70 font-medium">Project ID</span>
                    <span className="text-emerald-900 font-mono text-xs bg-emerald-100 px-2 py-1 rounded">{result.project.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700/70 font-medium">Container</span>
                    <span className="text-emerald-900 font-mono text-xs bg-emerald-100 px-2 py-1 rounded">{result.runResult.containerName}</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <h4 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Build Logs
                  </h4>
                  <pre className="bg-emerald-950 p-4 rounded-xl text-xs text-emerald-400 overflow-x-auto font-mono leading-relaxed border border-emerald-900 shadow-inner">
                    {result.runResult.logs.join("\n")}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
