import type { Response } from "express";
import type { AuthenticatedRequest, UploadVersionBody } from "../types/index.js";
import { codeVersionService } from "../services/codeVersionService.js";
import { projectService } from "../services/projectService.js";
import { analysisService } from "../services/analysisService.js";

/**
 * Upload a new code version and optionally trigger analysis
 * POST /projects/:projectId/versions
 */
export async function uploadVersion(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const { versionLabel, sourceCode } = req.body as UploadVersionBody;

    // Verify project ownership
    const project = await projectService.findById(projectId, req.userId!);
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    if (!sourceCode) {
      res.status(400).json({ success: false, error: "Source code is required" });
      return;
    }

    // Create version record (sourceCode is NOT stored)
    const version = await codeVersionService.create(projectId, versionLabel);

    // Automatically trigger analysis
    // sourceCode is passed to AI but not persisted
    await analysisService.analyzeCode(version.id, sourceCode);

    // Fetch complete version with analysis
    const completeVersion = await codeVersionService.findById(version.id);

    res.status(201).json({ success: true, data: completeVersion });
  } catch (error) {
    console.error("Error uploading version:", error);
    res.status(500).json({ success: false, error: "Failed to upload version" });
  }
}

/**
 * Get all versions for a project
 * GET /projects/:projectId/versions
 */
export async function getVersions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const projectId = req.params.projectId as string;

    // Verify project ownership
    const project = await projectService.findById(projectId, req.userId!);
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const versions = await codeVersionService.findByProject(projectId);

    res.json({ success: true, data: versions });
  } catch (error) {
    console.error("Error fetching versions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch versions" });
  }
}

/**
 * Get a single version with analysis
 * GET /versions/:id
 */
export async function getVersionById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    // Verify ownership
    const version = await codeVersionService.verifyOwnership(id, req.userId!);
    if (!version) {
      res.status(404).json({ success: false, error: "Version not found" });
      return;
    }

    // Get full version details
    const fullVersion = await codeVersionService.findById(id);

    res.json({ success: true, data: fullVersion });
  } catch (error) {
    console.error("Error fetching version:", error);
    res.status(500).json({ success: false, error: "Failed to fetch version" });
  }
}
