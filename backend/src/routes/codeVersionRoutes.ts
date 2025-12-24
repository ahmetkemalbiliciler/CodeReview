import { Router } from "express";
import { 
  uploadVersion, 
  getVersions, 
  getVersionById 
} from "../controllers/codeVersionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /projects/:projectId/versions - Upload new version
router.post("/projects/:projectId/versions", uploadVersion);

// GET /projects/:projectId/versions - List versions for project
router.get("/projects/:projectId/versions", getVersions);

// GET /versions/:id - Get version by ID
router.get("/versions/:id", getVersionById);

export default router;
