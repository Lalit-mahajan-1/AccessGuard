// controllers/repoController.ts
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import {
  cloneRepo,
  destroyContainer,
  runInContainer,
} from "../services/dockerService.js";
import { randomUUID } from "crypto";
import { analyzeUrlData } from "./urlController.js";
import { lighthouseData } from "./LightHouseController.js";

const prisma = new PrismaClient();

export const detectRepo = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { githubRepo, prodLink } = req.body;

  if (!githubRepo || !prodLink) {
    res
      .status(400)
      .json({ success: false, error: "githubRepo and prodLink are required" });
    return;
  }

  const containerName = `detect-${randomUUID()}`;

  try {
    await cloneRepo({ githubRepo, containerName });

    const { stdout: findOutput } = await runInContainer(
      containerName,
      `find /app -name "package.json" -not -path "*/node_modules/*" | sort`,
    );

    const packagePaths = findOutput.trim().split("\n").filter(Boolean);

    if (packagePaths.length === 0) {
      res.status(422).json({
        success: false,
        error: "No package.json found. Only JavaScript projects are supported.",
      });
      return;
    }

    const projects = [];

    for (const pkgPath of packagePaths) {
      const { stdout: pkgRaw } = await runInContainer(
        containerName,
        `cat ${pkgPath}`,
      );

      try {
        const pkg = JSON.parse(pkgRaw);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const scripts = Object.keys(pkg.scripts || {});
        const folder =
          pkgPath.replace("/app/", "").replace("/package.json", "") || "root";

        const { stdout: pmOut } = await runInContainer(
          containerName,
          `test -f /app/bun.lockb && echo bun || test -f /app/pnpm-lock.yaml && echo pnpm || test -f /app/yarn.lock && echo yarn || echo npm`,
        );
        const packageManager = pmOut.trim();

        const framework = deps["next"]
          ? "next"
          : deps["vite"]
            ? "vite"
            : deps["react"]
              ? "react"
              : deps["vue"]
                ? "vue"
                : deps["express"] || deps["fastify"] || deps["hono"]
                  ? "node-server"
                  : "node";

        const runCommands = scripts
          .filter((s) => ["lint", "build", "test", "typecheck"].includes(s))
          .map((s) => `${packageManager} run ${s}`);

        projects.push({
          folder,
          framework,
          packageManager,
          hasTypeScript: !!deps["typescript"],
          scripts,
          runCommands,
          dependencies: Object.keys(deps),
        });
      } catch {
        continue;
      }
    }

    const { stdout: treeOutput } = await runInContainer(
      containerName,
      "find /app -type f | grep -v node_modules | grep -v .git | grep -v dist | grep -v .next | sort",
    );

    const tree = treeOutput
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => p.replace("/app/", "").replace("/app", "").trim())
      .filter(Boolean);

    const metaVal = {
      type: projects.length > 1 ? "monorepo" : "single",
      projects,
    };

    const existing = await prisma.project.findFirst({
      where: { githubRepo, userId: req.user!.id }
    });

    let project;
    if (existing) {
      project = await prisma.project.update({
        where: { id: existing.id },
        data: {
          prodLink,
          meta: metaVal,
          tree,
        }
      });
    } else {
      project = await prisma.project.create({
        data: {
          githubRepo,
          prodLink,
          meta: metaVal,
          tree,
          userId: req.user!.id,
        }
      });
    }

    res.json({
      success: true,
      project,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await destroyContainer(containerName);
  }
};

export const listProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== 'string') {
    res.status(400).json({ success: false, error: "Invalid ID parameter" });
    return;
  }
  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== 'string') {
    res.status(400).json({ success: false, error: "Invalid ID parameter" });
    return;
  }
  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }
    await prisma.project.delete({
      where: { id },
    });
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const runProjectAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== 'string') {
    res.status(400).json({ success: false, error: "Invalid ID parameter" });
    return;
  }
  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const url = project.prodLink;

    // Run Playwright first, then Lighthouse sequentially
    let analyzeResult: any;
    try {
      analyzeResult = { status: 'fulfilled', value: await analyzeUrlData(url) };
    } catch (err: any) {
      analyzeResult = { status: 'rejected', reason: err };
    }

    let lighthouseResult: any;
    try {
      lighthouseResult = { status: 'fulfilled', value: await lighthouseData(url, req) };
    } catch (err: any) {
      lighthouseResult = { status: 'rejected', reason: err };
    }

    const analyze =
      analyzeResult.status === 'fulfilled'
        ? {
            performanceMetrics: analyzeResult.value.performance,
            accessibility: analyzeResult.value.axeCore,
            consoleLogs: analyzeResult.value.console,
            networkRequests: analyzeResult.value.network,
            memory: analyzeResult.value.memory,
          }
        : { error: analyzeResult.reason?.message };

    const lighthouse =
      lighthouseResult.status === 'fulfilled'
        ? lighthouseResult.value
        : { error: lighthouseResult.reason?.message };

    const auditResponse = {
      success: true,
      url,
      analyze,
      lighthouse,
      timestamp: new Date().toISOString(),
    };

    // Save to database
    const audit = await prisma.audit.create({
      data: {
        projectId: project.id,
        userId: req.user!.id,
        prodLink: url,
        response: auditResponse,
      }
    });

    res.json({
      success: true,
      audit,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProjectAudits = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== 'string') {
    res.status(400).json({ success: false, error: "Invalid ID parameter" });
    return;
  }
  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const audits = await prisma.audit.findMany({
      where: { projectId: project.id, userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, audits });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
