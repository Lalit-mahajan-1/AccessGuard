import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../lib/prisma.js";
import { PlannerAgent } from "../agents/plannerAgent.js";
import { fixWorkflow } from "../workflows/fixWorkflow.js";
import { DockerSandbox } from "../tools/dockerSandbox.js";
import { FixAgent } from "../agents/fixAgent.js";
import { PrAgent } from "../agents/prAgent.js";

// In-memory mapping of active projectId -> sandbox containerName
const activeSandboxes = new Map<string, string>();

// POST /api/agent/plan - Generate project plan
export const generatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, auditId } = req.body;
  if (!projectId || !auditId) {
    res.status(400).json({ success: false, error: "projectId and auditId are required" });
    return;
  }

  try {
    const plan = await PlannerAgent.plan(projectId as string, auditId as string);
    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/agent/execute - Run the agent graph workflow to fix files and open a PR (synchronous workflow)
export const executeFixGraph = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, auditId, verificationCommand } = req.body;
  if (!projectId || !auditId) {
    res.status(400).json({ success: false, error: "projectId and auditId are required" });
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId as string, userId: req.user!.id as string },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const audit = await prisma.audit.findFirst({
      where: { id: auditId as string, projectId: project.id, userId: req.user!.id as string },
    });
    if (!audit) {
      res.status(404).json({ success: false, error: "Audit not found" });
      return;
    }

    // Run the compiled LangGraph workflow graph
    console.log(`[AgentController] Invoking agent graph for repo: ${project.githubRepo}`);
    const finalState = await fixWorkflow.invoke({
      projectId: projectId as string,
      auditId: auditId as string,
      githubRepo: project.githubRepo,
      verificationCommand: (verificationCommand as string) || "npm run build",
      tasks: [],
      currentTaskIndex: 0,
      containerName: null,
      successfulFixes: [],
      failedFixes: [],
      prUrl: null,
    });

    res.json({
      success: true,
      result: {
        prUrl: finalState.prUrl,
        successfulFixes: finalState.successfulFixes,
        failedFixes: finalState.failedFixes,
      },
    });
  } catch (err: any) {
    console.error(`[AgentController] Workflow invocation failed: ${err.message}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/agent/execute-pipeline - Start asynchronous background fixing of all tasks
export const executeFixPipeline = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, auditId } = req.body;
  if (!projectId || !auditId) {
    res.status(400).json({ success: false, error: "projectId and auditId are required" });
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId as string, userId: req.user!.id as string },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    // Reset status of all action items for this audit to pending
    await prisma.actionItem.updateMany({
      where: { auditId: auditId as string, userId: req.user!.id as string },
      data: { status: "pending" },
    });

    const githubRepo = project.githubRepo;
    const userId = req.user!.id as string;
    const projectMeta = project.meta as any;
    const subProjects = projectMeta?.projects || [];
    const subFolders = subProjects.map((p: any) => p.folder).filter(Boolean);

    // Start execution loop in the background to prevent HTTP timeouts
    (async () => {
      let containerName = activeSandboxes.get(projectId as string);
      try {
        if (!containerName) {
          console.log(`[Pipeline] Spawning docker sandbox for project: ${githubRepo} with folders: ${subFolders.join(", ")}`);
          containerName = await DockerSandbox.createSandbox(githubRepo, projectId as string, subFolders);
          activeSandboxes.set(projectId as string, containerName);
        }

        const actionItems = await prisma.actionItem.findMany({
          where: { auditId: auditId as string, userId },
          orderBy: { createdAt: "asc" },
        });

        for (const item of actionItems) {
          console.log(`[Pipeline] Executing task ${item.id} on file ${item.file}`);
          await prisma.actionItem.update({
            where: { id: item.id },
            data: { status: "in-progress" },
          });

          const result = await FixAgent.executeFix(
            containerName,
            {
              file: item.file,
              issue: item.issue,
              fix: item.fix,
              type: item.type,
              priority: item.priority,
              task: item.task,
            },
            "npm run build"
          );

          if (result.success) {
            console.log(`[Pipeline] Task ${item.id} succeeded`);
            await prisma.actionItem.update({
              where: { id: item.id },
              data: { status: "completed", file: result.file },
            });
          } else {
            console.warn(`[Pipeline] Task ${item.id} failed: ${result.errorLogs}`);
            await prisma.actionItem.update({
              where: { id: item.id },
              data: { status: "failed" },
            });
          }
        }
      } catch (err: any) {
        console.error(`[Pipeline] Global error: ${err.message}`);
        // Reset any remaining in-progress items to failed
        await prisma.actionItem.updateMany({
          where: { auditId: auditId as string, status: "in-progress" },
          data: { status: "failed" },
        });
      }
    })();

    res.json({ success: true, message: "Pipeline started successfully in background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/agent/submit-pr - Commits successful action items and opens PR
export const submitPullRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, auditId } = req.body;
  if (!projectId || !auditId) {
    res.status(400).json({ success: false, error: "projectId and auditId are required" });
    return;
  }

  const containerName = activeSandboxes.get(projectId as string);
  if (!containerName) {
    res.status(400).json({ success: false, error: "No active sandbox found. Please run the execution pipeline first." });
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId as string, userId: req.user!.id as string },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const completedFixes = await prisma.actionItem.findMany({
      where: { auditId: auditId as string, status: "completed", userId: req.user!.id as string },
    });

    if (completedFixes.length === 0) {
      res.status(400).json({ success: false, error: "No completed fixes found to commit. PR aborted." });
      return;
    }

    console.log(`[Pipeline] Submitting Pull Request on GitHub for ${completedFixes.length} fixes`);
    const prUrl = await PrAgent.createPrForFixes(
      project.githubRepo,
      containerName,
      completedFixes.map((f) => ({
        file: f.file,
        task: f.task,
        issue: f.issue,
      })),
      projectId as string
    );

    // Stop and remove sandbox
    await DockerSandbox.cleanupSandbox(containerName);
    activeSandboxes.delete(projectId as string);

    res.json({ success: true, prUrl });
  } catch (err: any) {
    console.error(`[Pipeline] PR submission failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};
