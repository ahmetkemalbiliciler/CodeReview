import type { Response } from "express";
import type { AuthenticatedRequest, CreateProjectBody } from "../types/index.js";
import { projectService } from "../services/projectService.js";

/**
 * Create a new project
 * POST /projects
 */
export async function createProject(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { name, description } = req.body as CreateProjectBody;

    if (!name) {
      res.status(400).json({ success: false, error: "Project name is required" });
      return;
    }

    const project = await projectService.create(req.userId!, name, description);

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, error: "Failed to create project" });
  }
}

/**
 * Get all projects for the authenticated user
 * GET /projects
 */
export async function getProjects(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const projects = await projectService.findByOwner(req.userId!);

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, error: "Failed to fetch projects" });
  }
}

/**
 * Get a single project by ID
 * GET /projects/:id
 */
export async function getProjectById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    const project = await projectService.findById(id, req.userId!);

    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ success: false, error: "Failed to fetch project" });
  }
}

/**
 * Delete a project
 * DELETE /projects/:id
 */
export async function deleteProject(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    const deleted = await projectService.delete(id, req.userId!);

    if (!deleted) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    res.json({ success: true, data: { message: "Project deleted successfully" } });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ success: false, error: "Failed to delete project" });
  }
}
