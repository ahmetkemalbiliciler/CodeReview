import { Router } from "express";
import { analyzeVersion, getAnalysis } from "../controllers/analysisController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/analyses/version/:versionId - Trigger analysis for a version
router.post("/version/:versionId", analyzeVersion);

// GET /api/analyses/version/:versionId - Get analysis results for a version
router.get("/version/:versionId", getAnalysis);

export default router;
