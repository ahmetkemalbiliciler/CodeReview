import { Router } from "express";
import { 
  compareVersions, 
  getComparison, 
  generateExplanation,
  listComparisons
} from "../controllers/comparisonController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/comparisons/project/:projectId - Compare two versions for a project
router.post("/project/:projectId", compareVersions);

// GET /api/comparisons/project/:projectId - List all comparisons for a project
router.get("/project/:projectId", listComparisons);

// GET /api/comparisons/:id - Get comparison details
router.get("/:id", getComparison);

// POST /api/comparisons/:id/explain - Generate AI explanation
router.post("/:id/explain", generateExplanation);

export default router;
