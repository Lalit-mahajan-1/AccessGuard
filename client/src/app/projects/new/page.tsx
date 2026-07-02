"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

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
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Add New Project</h1>
        <p className="text-gray-400 mb-8">
          Connect your GitHub repo & production URL for automated auditing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* GitHub Repo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              GitHub Repo URL
            </label>
            <input
              type="url"
              name="githubRepo"
              value={form.githubRepo}
              onChange={handleChange}
              required
              placeholder="https://github.com/user/repo.git"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Production Link */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Production URL
            </label>
            <input
              type="url"
              name="prodLink"
              value={form.prodLink}
              onChange={handleChange}
              required
              placeholder="https://yourapp.com"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Frontend Language */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Frontend Framework
            </label>
            <select
              name="frontendLang"
              value={form.frontendLang}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 focus:outline-none"
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
          <div>
            <label className="block text-sm font-medium mb-2">
              Backend Language
            </label>
            <select
              name="backendLang"
              value={form.backendLang}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 focus:outline-none"
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

          {/* Run Commands */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Run Commands{" "}
              <span className="text-gray-500">(comma-separated)</span>
            </label>
            <input
              type="text"
              name="runCommands"
              value={form.runCommands}
              onChange={handleChange}
              required
              placeholder="npm install, npm run dev"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              e.g. <code>npm install, npm run build, npm start</code>
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 font-semibold transition"
          >
            {loading ? "Setting up container..." : "Create Project"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-950 border border-red-800 text-red-200">
            ❌ {error}
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-6 p-4 rounded-lg bg-green-950 border border-green-800">
            <h3 className="font-bold text-green-300 mb-3">
              ✅ Project Created
            </h3>

            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-400">Project ID:</span>{" "}
                {result.project.id}
              </div>
              <div>
                <span className="text-gray-400">Container:</span>{" "}
                {result.runResult.containerName}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                Logs:
              </h4>
              <pre className="bg-black p-3 rounded text-xs text-green-400 overflow-x-auto">
                {result.runResult.logs.join("\n")}
              </pre>
            </div>

            <button
              onClick={() => router.push("/projects")}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              View All Projects →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
