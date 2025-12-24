import { Router } from "express";
import { 
  createProject, 
  getProjects, 
  getProjectById, 
  deleteProject 
} from "../controllers/projectController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/projects - Create new project
router.post("/", createProject);

// GET /api/projects - List all projects
router.get("/", getProjects);

// GET /api/projects/:id - Get project by ID
router.get("/:id", getProjectById);

// DELETE /api/projects/:id - Delete project
router.delete("/:id", deleteProject);

export default router;
