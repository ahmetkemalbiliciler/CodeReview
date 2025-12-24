import { Router } from "express";
import { 
  compareVersions, 
  getComparison, 
  generateExplanation 
} from "../controllers/comparisonController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /projects/:projectId/compare - Compare two versions
router.post("/projects/:projectId/compare", compareVersions);

// GET /comparisons/:id - Get comparison details
router.get("/comparisons/:id", getComparison);

// POST /comparisons/:id/explain - Generate AI explanation
router.post("/comparisons/:id/explain", generateExplanation);

export default router;
