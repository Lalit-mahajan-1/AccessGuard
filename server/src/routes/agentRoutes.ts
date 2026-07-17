import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { generatePlan, executeFixGraph, executeFixPipeline, submitPullRequest } from "../controllers/agentController.js";

const router = Router();

router.post("/plan", protect, generatePlan);
router.post("/execute", protect, executeFixGraph);
router.post("/execute-pipeline", protect, executeFixPipeline);
router.post("/submit-pr", protect, submitPullRequest);

export default router;
