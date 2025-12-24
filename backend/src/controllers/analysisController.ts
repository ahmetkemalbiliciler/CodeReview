import type { Response } from "express";
import type { AuthenticatedRequest, UploadVersionBody } from "../types/index.js";
import { codeVersionService } from "../services/codeVersionService.js";
import { analysisService } from "../services/analysisService.js";

/**
 * Trigger analysis for a code version
 * POST /versions/:versionId/analyze
 */
export async function analyzeVersion(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const versionId = req.params.versionId as string;
    const { sourceCode } = req.body as UploadVersionBody;

    // Verify ownership
    const version = await codeVersionService.verifyOwnership(versionId, req.userId!);
    if (!version) {
      res.status(404).json({ success: false, error: "Version not found" });
      return;
    }

    // Check if analysis already exists
    const existingAnalysis = await analysisService.getByCodeVersionId(versionId);
    if (existingAnalysis) {
      res.status(400).json({ 
        success: false, 
        error: "Analysis already exists for this version",
        data: existingAnalysis 
      });
      return;
    }

    if (!sourceCode) {
      res.status(400).json({ success: false, error: "Source code is required for analysis" });
      return;
    }

    // Run analysis (sourceCode is NOT stored)
    const analysis = await analysisService.analyzeCode(versionId, sourceCode);

    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    console.error("Error analyzing version:", error);
    res.status(500).json({ success: false, error: "Failed to analyze version" });
  }
}

/**
 * Get analysis results for a version
 * GET /versions/:versionId/analysis
 */
export async function getAnalysis(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const versionId = req.params.versionId as string;

    // Verify ownership
    const version = await codeVersionService.verifyOwnership(versionId, req.userId!);
    if (!version) {
      res.status(404).json({ success: false, error: "Version not found" });
      return;
    }

    const analysis = await analysisService.getByCodeVersionId(versionId);

    if (!analysis) {
      res.status(404).json({ success: false, error: "No analysis found for this version" });
      return;
    }

    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({ success: false, error: "Failed to fetch analysis" });
  }
}
