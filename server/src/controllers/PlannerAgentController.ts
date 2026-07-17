import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../lib/prisma.js";
import { buildPlannerPrompt } from "../utils/plannerPrompt.js";

export const generateProjectPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId, auditId } = req.params;

  if (typeof projectId !== "string" || typeof auditId !== "string") {
    res.status(400).json({ success: false, error: "Invalid parameters" });
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id },
    });

    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const audit = await prisma.audit.findFirst({
      where: { id: auditId, projectId: project.id, userId: req.user!.id },
    });

    if (!audit) {
      res.status(404).json({ success: false, error: "Audit not found" });
      return;
    }

    // Extract repository structure metadata
    const projectMeta = project.meta as any;
    const subProjects = projectMeta?.projects || [];
    const firstProj = subProjects[0] || {};
    const framework = firstProj.framework || "Vanilla JS";
    const folder = firstProj.folder || "root";
    const tree = (project.tree as string[]) || [];

    // Extract findings from audit report response
    const auditResponse = audit.response as any;
    const analyze = auditResponse?.analyze || {};
    const lighthouse = auditResponse?.lighthouse || {};

    const accessibilityViolations: any[] = [];
    if (analyze.accessibility?.violations) {
      for (const v of analyze.accessibility.violations) {
        const nodes = v.nodes || [];
        for (const node of nodes) {
          accessibilityViolations.push({
            id: v.id || "",
            impact: v.impact || "moderate",
            selector: node.selector || "unknown",
            html: node.html || "",
            failureSummary: node.failure || "",
            description: v.description || "",
            help: v.help || "",
          });
        }
      }
    }

    // Lighthouse scores
    const lighthouseScores = {
      performance: lighthouse.scores?.performance || 0,
      accessibility: lighthouse.scores?.accessibility || 0,
      bestPractices: lighthouse.scores?.bestPractices || 0,
      seo: lighthouse.scores?.seo || 0,
    };

    // Missing security headers (check network requests main document headers)
    const missingSecurityHeaders: string[] = [];
    const secHeaders = analyze.networkRequests?.mainDocument?.securityHeaders;
    if (secHeaders) {
      if (!secHeaders.csp) missingSecurityHeaders.push("Content-Security-Policy");
      if (!secHeaders.hsts) missingSecurityHeaders.push("Strict-Transport-Security");
      if (!secHeaders.xContentType) missingSecurityHeaders.push("X-Content-Type-Options");
      if (!secHeaders.xFrame) missingSecurityHeaders.push("X-Frame-Options");
      if (!secHeaders.referrerPolicy) missingSecurityHeaders.push("Referrer-Policy");
    } else {
      missingSecurityHeaders.push(
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy"
      );
    }

    const unusedJavascript = analyze.unusedJavascript || null;
    const consoleErrors = (analyze.consoleLogs?.errors || 0) > 0;

    // Build the Seniors AI prompt using the utils prompt builder
    const prompt = buildPlannerPrompt({
      framework,
      folder,
      tree,
      findings: {
        accessibilityViolations,
        missingSecurityHeaders,
        unusedJavascript,
        consoleErrors,
        lighthouseScores,
      },
    });

    // Make the POST request to local Ollama instance
    const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

    // Query installed models to select an appropriate fallback if qwen2.5-coder:7b is missing
    let modelToUse = ollamaModel;
    try {
      const tagsUrl = ollamaUrl.replace("/generate", "/tags");
      const tagsRes = await fetch(tagsUrl);
      if (tagsRes.ok) {
        const tagsData = (await tagsRes.json()) as { models?: { name: string }[] };
        const installedModels = tagsData.models?.map((m) => m.name) || [];
        if (installedModels.length > 0) {
          const hasExact = installedModels.includes(ollamaModel);
          const matched = installedModels.find((name) => name.split(":")[0] === ollamaModel.split(":")[0]);
          if (hasExact) {
            modelToUse = ollamaModel;
          } else if (matched) {
            modelToUse = matched;
          } else {
            modelToUse = installedModels[0] || ollamaModel;
            console.log(`[Ollama] Model "${ollamaModel}" not found. Falling back to "${modelToUse}".`);
          }
        }
      }
    } catch (tagsErr) {
      console.warn("[Ollama] Could not query local tags, using default model value.", tagsErr);
    }

    const fetchRes = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        prompt: prompt,
        stream: false,
        format: "json",
      }),
    });

    if (!fetchRes.ok) {
      let errMsg = fetchRes.statusText;
      try {
        const errJson = (await fetchRes.json()) as any;
        if (errJson && errJson.error) {
          errMsg = errJson.error;
        }
      } catch {}
      throw new Error(`Ollama API error: ${errMsg}`);
    }

    const data = (await fetchRes.json()) as { response: string };

    // Extract JSON array robustly
    const extractJsonArray = (text: string): any[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") {
          const arr = Object.values(parsed).find((v) => Array.isArray(v));
          if (arr) return arr as any[];
          return [parsed];
        }
      } catch {}

      // Strip markdown code blocks
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") {
          const arr = Object.values(parsed).find((v) => Array.isArray(v));
          if (arr) return arr as any[];
          return [parsed];
        }
      } catch {}

      // Search bracket boundaries
      const firstOpen = text.indexOf("[");
      const lastClose = text.lastIndexOf("]");
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        const candidate = text.slice(firstOpen, lastClose + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed)) return parsed;
        } catch {}

        try {
          const fixed = candidate
            .replace(/,\s*}/g, "}")
            .replace(/,\s*\]/g, "]");
          const parsed = JSON.parse(fixed);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }

      // Try finding separate object items
      const list: any[] = [];
      const regex = /{[^{}]*}/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        try {
          const parsed = JSON.parse(match[0]);
          list.push(parsed);
        } catch {}
      }
      if (list.length > 0) return list;

      return [];
    };

    const plan = extractJsonArray(data.response);

    const normalizedPlan = plan.map((item: any) => {
      if (!item || typeof item !== "object") return null;
      return {
        task: item.task || item.description || item.title || item.name || "",
        file: item.file || item.filePath || item.path || item.filename || "",
        type: item.type || item.category || "accessibility",
        priority: item.priority || "medium",
        issue: item.issue || item.violation || item.description || item.reason || "",
        fix: item.fix || item.remedy || item.solution || item.instruction || item.action || "",
      };
    }).filter(Boolean);

    // Clear old action items for this audit to prevent duplicates
    await prisma.actionItem.deleteMany({
      where: { auditId },
    });

    // Create action items in DB
    const savedActionItems = await Promise.all(
      normalizedPlan.map((item: any) =>
        prisma.actionItem.create({
          data: {
            task: item.task,
            file: item.file,
            type: item.type,
            priority: item.priority,
            issue: item.issue,
            fix: item.fix,
            status: "pending",
            projectId,
            auditId,
            userId: req.user!.id,
          },
        })
      )
    );

    console.log("[Ollama Raw Response]", data.response);
    console.log("[Ollama Stored Action Items]", savedActionItems);

    res.json({
      success: true,
      plan: savedActionItems,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};