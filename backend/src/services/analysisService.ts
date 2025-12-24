import prisma from "../utils/prisma.js";
import type { AIAnalysisResponse, AIIssue } from "../types/index.js";

export const analysisService = {
  /**
   * Analyze code using AI and store structured results
   * sourceCode is passed to AI but NOT stored in database
   */
  async analyzeCode(codeVersionId: string, sourceCode: string) {
    // Call AI to analyze the code
    const aiResponse = await callAIForAnalysis(sourceCode);

    // Store structured analysis results
    const analysisResult = await prisma.analysisResult.create({
      data: {
        codeVersionId,
        summary: aiResponse.summary,
        issues: {
          create: aiResponse.issues.map((issue: AIIssue) => ({
            issueCode: issue.issueCode,
            severity: issue.severity,
            complexity: issue.complexity,
            functionName: issue.functionName,
            startLine: issue.startLine,
            endLine: issue.endLine,
            snippet: issue.beforeSnippet || issue.afterSnippet
              ? {
                  create: {
                    beforeSnippet: issue.beforeSnippet,
                    afterSnippet: issue.afterSnippet,
                  },
                }
              : undefined,
          })),
        },
      },
      include: {
        issues: {
          include: {
            snippet: true,
          },
        },
      },
    });

    return analysisResult;
  },

  /**
   * Get analysis for a code version
   */
  async getByCodeVersionId(codeVersionId: string) {
    return prisma.analysisResult.findUnique({
      where: { codeVersionId },
      include: {
        issues: {
          include: {
            snippet: true,
          },
        },
      },
    });
  },
};

/**
 * Call AI API to analyze source code
 * Returns structured JSON analysis
 * 
 * TODO: Replace with actual AI API call (OpenAI, Gemini, etc.)
 * Currently returns mock data for development
 */
async function callAIForAnalysis(sourceCode: string): Promise<AIAnalysisResponse> {
  console.log("Analyzing code with AI... (mock implementation)");
  console.log("Source code length:", sourceCode.length, "characters");

  // Mock response for development
  return {
    summary: "Code analysis completed. Found potential issues related to complexity and code quality.",
    issues: [
      {
        issueCode: "NESTED_LOOP",
        severity: "high",
        complexity: "O_n2",
        functionName: "processData",
        startLine: 10,
        endLine: 25,
        beforeSnippet: "for (let i = 0; i < arr.length; i++) {\n  for (let j = 0; j < arr.length; j++) {\n    // O(n²) complexity\n  }\n}",
        afterSnippet: "const map = new Map();\narr.forEach(item => map.set(item.key, item));",
      },
    ],
  };
}
