import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cloneAndRun, stopContainer } from '../services/dockerService.js';

const prisma = new PrismaClient();

// 🔹 Temp dev user — replace when auth is ready
const DEV_USER_ID = 'dev-user-id';

// Ensure dev user exists on startup
const ensureDevUser = async () => {
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      email: 'dev@local.test',
      name: 'Dev User',
    },
  });
};
ensureDevUser().catch(console.error);

export const createProject = async (req: Request, res: Response): Promise<void> => {
  const { githubRepo, prodLink, frontendLang, backendLang, runCommands } = req.body;

  if (!githubRepo || !prodLink || !frontendLang || !backendLang || !Array.isArray(runCommands)) {
    res.status(400).json({
      error: 'Missing fields: githubRepo, prodLink, frontendLang, backendLang, runCommands[]',
    });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        githubRepo,
        prodLink,
        frontendLang,
        backendLang,
        runCommands,
        userId: DEV_USER_ID,
      },
    });

    const runResult = await cloneAndRun({ githubRepo, runCommands });

    res.json({ success: true, project, runResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listProjects = async (_req: Request, res: Response): Promise<void> => {
  const projects = await prisma.project.findMany({
    where: { userId: DEV_USER_ID },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, projects });
};

export const stopProject = async (req: Request, res: Response): Promise<void> => {
  const { containerName } = req.body;
  if (!containerName) {
    res.status(400).json({ error: 'containerName required' });
    return;
  }
  const result = await stopContainer(containerName);
  res.json(result);
};