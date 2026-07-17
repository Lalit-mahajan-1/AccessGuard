import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../lib/prisma.js";

// GET /api/action-items - Get all action items for the user, with optional filters
export const getActionItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, auditId, status } = req.query;
  try {
    const where: any = { userId: req.user!.id as string };
    if (typeof projectId === "string") where.projectId = projectId;
    if (typeof auditId === "string") where.auditId = auditId;
    if (typeof status === "string") where.status = status;

    const items = await prisma.actionItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, actionItems: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/action-items/:id - Get detailed action item by ID
export const getActionItemById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ success: false, error: "Invalid ID parameter" });
    return;
  }
  try {
    const item = await prisma.actionItem.findFirst({
      where: { id, userId: req.user!.id as string },
    });
    if (!item) {
      res.status(404).json({ success: false, error: "Action item not found" });
      return;
    }
    res.json({ success: true, actionItem: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/action-items - Create a manual action item
export const createActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, auditId, task, file, type, priority, issue, fix, status } = req.body;
  if (!projectId || !auditId || !task || !file) {
    res.status(400).json({ success: false, error: "Missing required fields (projectId, auditId, task, file)" });
    return;
  }
  try {
    // Validate project & audit belong to user
    const project = await prisma.project.findFirst({
      where: { id: projectId as string, userId: req.user!.id as string },
    });
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const item = await prisma.actionItem.create({
      data: {
        task,
        file,
        type: type || "accessibility",
        priority: priority || "medium",
        issue: issue || "",
        fix: fix || "",
        status: status || "pending",
        projectId,
        auditId,
        userId: req.user!.id as string,
      },
    });
    res.status(201).json({ success: true, actionItem: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/action-items/:id - Update action item
export const updateActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ success: false, error: "Invalid ID parameter" });
    return;
  }
  const { task, file, type, priority, issue, fix, status } = req.body;
  try {
    const existing = await prisma.actionItem.findFirst({
      where: { id, userId: req.user!.id as string },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: "Action item not found" });
      return;
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        task: task !== undefined ? task : existing.task,
        file: file !== undefined ? file : existing.file,
        type: type !== undefined ? type : existing.type,
        priority: priority !== undefined ? priority : existing.priority,
        issue: issue !== undefined ? issue : existing.issue,
        fix: fix !== undefined ? fix : existing.fix,
        status: status !== undefined ? status : existing.status,
      },
    });
    res.json({ success: true, actionItem: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/action-items/:id - Delete action item
export const deleteActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ success: false, error: "Invalid ID parameter" });
    return;
  }
  try {
    const existing = await prisma.actionItem.findFirst({
      where: { id, userId: req.user!.id as string },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: "Action item not found" });
      return;
    }

    await prisma.actionItem.delete({
      where: { id },
    });
    res.json({ success: true, message: "Action item deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
