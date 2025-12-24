import { Router } from "express";
import { analyzeVersion, getAnalysis } from "../controllers/analysisController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /versions/:versionId/analyze - Trigger analysis
router.post("/versions/:versionId/analyze", analyzeVersion);

// GET /versions/:versionId/analysis - Get analysis results
router.get("/versions/:versionId/analysis", getAnalysis);

export default router;
