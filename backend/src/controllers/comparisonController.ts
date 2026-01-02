import type { Response } from "express";
import type { AuthenticatedRequest, CompareVersionsBody } from "../types/index.js";
import { projectService } from "../services/projectService.js";
import { codeVersionService } from "../services/codeVersionService.js";
import { analysisService } from "../services/analysisService.js";
import { comparisonService } from "../services/comparisonService.js";
import { aiExplanationService } from "../services/aiExplanationService.js";

/**
 * Compare two code versions (deterministic comparison)
 * Returns cached comparison if exists, otherwise creates new
 * POST /projects/:projectId/compare
 */
export async function compareVersions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const { fromVersionId, toVersionId } = req.body as CompareVersionsBody;

    // Verify project ownership
    const project = await projectService.findById(projectId, req.userId!);
    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    if (!fromVersionId || !toVersionId) {
      res.status(400).json({ 
        success: false, 
        error: "Both fromVersionId and toVersionId are required" 
      });
      return;
    }

    // Verify both versions belong to this project
    const [fromVersion, toVersion] = await Promise.all([
      codeVersionService.findById(fromVersionId),
      codeVersionService.findById(toVersionId),
    ]);

    if (!fromVersion || fromVersion.projectId !== projectId) {
      res.status(400).json({ success: false, error: "Invalid fromVersionId" });
      return;
    }

    if (!toVersion || toVersion.projectId !== projectId) {
      res.status(400).json({ success: false, error: "Invalid toVersionId" });
      return;
    }

    // Check both versions have analyses
    const fromAnalysis = await analysisService.getByCodeVersionId(fromVersionId);
    const toAnalysis = await analysisService.getByCodeVersionId(toVersionId);

    if (!fromAnalysis) {
      res.status(400).json({ 
        success: false, 
        error: "fromVersion does not have an analysis" 
      });
      return;
    }

    if (!toAnalysis) {
      res.status(400).json({ 
        success: false, 
        error: "toVersion does not have an analysis" 
      });
      return;
    }

    // Check if comparison already exists (cache)
    const existingComparison = await comparisonService.findExisting(
      fromAnalysis.id,
      toAnalysis.id
    );

    if (existingComparison) {
      // Return cached comparison
      res.status(200).json({ 
        success: true, 
        data: existingComparison,
        cached: true 
      });
      return;
    }

    // Run DETERMINISTIC comparison (AI is NOT involved)
    const comparison = await comparisonService.compareAnalyses(
      projectId,
      fromAnalysis.id,
      toAnalysis.id
    );

    res.status(201).json({ success: true, data: comparison, cached: false });
  } catch (error) {
    console.error("Error comparing versions:", error);
    res.status(500).json({ success: false, error: "Failed to compare versions" });
  }
}

/**
 * List all comparisons for a project
 * GET /comparisons/project/:projectId
 */
export async function listComparisons(
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

    const comparisons = await comparisonService.findByProject(projectId);

    res.json({ success: true, data: comparisons });
  } catch (error) {
    console.error("Error listing comparisons:", error);
    res.status(500).json({ success: false, error: "Failed to list comparisons" });
  }
}

/**
 * Get comparison details
 * GET /comparisons/:id
 */
export async function getComparison(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    // Verify ownership
    const comparison = await comparisonService.verifyOwnership(id, req.userId!);
    if (!comparison) {
      res.status(404).json({ success: false, error: "Comparison not found" });
      return;
    }

    // Get full details
    const fullComparison = await comparisonService.getById(id);

    res.json({ success: true, data: fullComparison });
  } catch (error) {
    console.error("Error fetching comparison:", error);
    res.status(500).json({ success: false, error: "Failed to fetch comparison" });
  }
}

/**
 * Generate AI explanation for a comparison
 * POST /comparisons/:id/explain
 */
export async function generateExplanation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    // Verify ownership
    const comparison = await comparisonService.verifyOwnership(id, req.userId!);
    if (!comparison) {
      res.status(404).json({ success: false, error: "Comparison not found" });
      return;
    }

    // Generate AI explanation for backend's deterministic decisions
    const explanation = await aiExplanationService.generateExplanation(id);

    res.status(201).json({ success: true, data: explanation });
  } catch (error) {
    console.error("Error generating explanation:", error);
    res.status(500).json({ success: false, error: "Failed to generate explanation" });
  }
}
