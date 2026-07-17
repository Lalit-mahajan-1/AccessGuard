import { prisma } from "../lib/prisma.js";
import { buildPlannerPrompt } from "../utils/plannerPrompt.js";
import { OllamaClient } from "../tools/ollamaClient.js";
import { parseAgentJson } from "../utils/parseAgentJson.js";

export class PlannerAgent {
  /**
   * Generates a raw action plan from repository tree structure and audit findings.
   */
  public static async plan(projectId: string, auditId: string): Promise<any[]> {
    const project = await prisma.project.findFirst({
      where: { id: projectId },
    });
    if (!project) throw new Error("Project not found");

    const audit = await prisma.audit.findFirst({
      where: { id: auditId, projectId: project.id },
    });
    if (!audit) throw new Error("Audit not found");

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

    const lighthouseScores = {
      performance: lighthouse.scores?.performance || 0,
      accessibility: lighthouse.scores?.accessibility || 0,
      bestPractices: lighthouse.scores?.bestPractices || 0,
      seo: lighthouse.scores?.seo || 0,
    };

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

    const response = await OllamaClient.generate(prompt, true);
    const plan = parseAgentJson(response);

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

    return normalizedPlan;
  }
}
