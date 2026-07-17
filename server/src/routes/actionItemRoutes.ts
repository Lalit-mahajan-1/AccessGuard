import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getActionItems,
  getActionItemById,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from "../controllers/actionItemController.js";

const router = Router();

router.get("/", protect, getActionItems);
router.get("/:id", protect, getActionItemById);
router.post("/", protect, createActionItem);
router.put("/:id", protect, updateActionItem);
router.delete("/:id", protect, deleteActionItem);

export default router;
