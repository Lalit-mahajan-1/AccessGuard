import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cloneAndRun, stopContainer } from '../services/dockerService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
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
        userId: req.user!.id,
      },
    });

    const runResult = await cloneAndRun({ githubRepo, runCommands });

    res.json({ success: true, project, runResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user.id },
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