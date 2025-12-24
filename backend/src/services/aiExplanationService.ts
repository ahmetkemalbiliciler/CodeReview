import prisma from "../utils/prisma.js";
import type { ComparisonResult } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
    const explanation = await callGeminiForExplanation(comparison.results);

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
 * Call Gemini API to generate natural language explanation
 * AI explains the BACKEND's deterministic decisions
 */
async function callGeminiForExplanation(results: ComparisonResult[]): Promise<string> {
  console.log("🤖 Generating explanation with Gemini...");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const improved = results.filter((r) => r.changeType === "IMPROVED");
    const worsened = results.filter((r) => r.changeType === "WORSENED");
    const unchanged = results.filter((r) => r.changeType === "UNCHANGED");

    const prompt = `You are a code review assistant. Explain the following comparison results between two code versions in a clear, helpful way.

The comparison was done DETERMINISTICALLY by the backend:
- IMPROVED = issue removed or severity/complexity decreased
- WORSENED = new issue or severity/complexity increased  
- UNCHANGED = no change in issue

COMPARISON RESULTS:
${JSON.stringify(results, null, 2)}

SUMMARY:
- Improvements: ${improved.length}
- Regressions: ${worsened.length}
- Unchanged: ${unchanged.length}

Write a concise explanation in MARKDOWN format with:
1. Overall assessment (1-2 sentences)
2. Improvements section (if any) - explain what got better
3. Regressions section (if any) - explain what needs attention
4. Recommendations (1-2 bullet points)

Keep it under 300 words. Be encouraging but honest.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("✅ Gemini explanation generated");

    return text;
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    
    // Fallback explanation
    const improved = results.filter((r) => r.changeType === "IMPROVED");
    const worsened = results.filter((r) => r.changeType === "WORSENED");
    
    return `## Code Comparison Summary

**Improvements:** ${improved.length} issue(s) resolved or improved
**Regressions:** ${worsened.length} issue(s) need attention

Unable to generate detailed AI explanation at this time. Please review the comparison results manually.`;
  }
}
