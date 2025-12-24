import prisma from "../utils/prisma.js";
import type { ComparisonResult } from "@prisma/client";

export const aiExplanationService = {
  /**
   * Generate AI explanation for comparison results
   * AI is only used to EXPLAIN the backend's deterministic decisions
   */
  async generateExplanation(comparisonId: string) {
    // Get comparison with results
    const comparison = await prisma.comparison.findUnique({
      where: { id: comparisonId },
      include: {
        results: true,
      },
    });

    if (!comparison) {
      throw new Error("Comparison not found");
    }

    // Check if explanation already exists
    const existingExplanation = await prisma.aIExplanation.findUnique({
      where: { comparisonId },
    });

    if (existingExplanation) {
      return existingExplanation;
    }

    // Call AI to explain the comparison results
    const explanation = await callAIForExplanation(comparison.results);

    // Store explanation
    const aiExplanation = await prisma.aIExplanation.create({
      data: {
        comparisonId,
        explanation,
      },
    });

    return aiExplanation;
  },

  /**
   * Get explanation by comparison ID
   */
  async getByComparisonId(comparisonId: string) {
    return prisma.aIExplanation.findUnique({
      where: { comparisonId },
    });
  },
};

/**
 * Call AI API to generate natural language explanation
 * AI explains the BACKEND's deterministic decisions
 * 
 * TODO: Replace with actual AI API call
 * Currently returns mock explanation for development
 */
async function callAIForExplanation(results: ComparisonResult[]): Promise<string> {
  console.log("Generating AI explanation... (mock implementation)");

  const improved = results.filter((r) => r.changeType === "IMPROVED");
  const worsened = results.filter((r) => r.changeType === "WORSENED");
  const unchanged = results.filter((r) => r.changeType === "UNCHANGED");

  // Mock explanation based on results
  let explanation = "## Code Review Comparison Summary\n\n";

  if (improved.length > 0) {
    explanation += `### ✅ Improvements (${improved.length})\n`;
    for (const result of improved) {
      explanation += `- **${result.issueCode}**: `;
      if (!result.afterSeverity) {
        explanation += "Issue has been completely resolved.\n";
      } else {
        explanation += `Severity reduced from ${result.beforeSeverity} to ${result.afterSeverity}.\n`;
      }
    }
    explanation += "\n";
  }

  if (worsened.length > 0) {
    explanation += `### ⚠️ Regressions (${worsened.length})\n`;
    for (const result of worsened) {
      explanation += `- **${result.issueCode}**: `;
      if (!result.beforeSeverity) {
        explanation += "New issue introduced.\n";
      } else {
        explanation += `Severity increased from ${result.beforeSeverity} to ${result.afterSeverity}.\n`;
      }
    }
    explanation += "\n";
  }

  if (unchanged.length > 0) {
    explanation += `### ➖ Unchanged (${unchanged.length})\n`;
    for (const result of unchanged) {
      explanation += `- **${result.issueCode}**: No change detected.\n`;
    }
  }

  return explanation;
}
