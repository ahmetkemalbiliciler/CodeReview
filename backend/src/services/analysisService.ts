import prisma from "../utils/prisma.js";
import type { AIAnalysisResponse, AIIssue } from "../types/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const analysisService = {
  /**
   * Analyze code using AI and store structured results
   * sourceCode is passed to AI but NOT stored in database
   */
  async analyzeCode(codeVersionId: string, sourceCode: string) {
    // Call AI to analyze the code
    const aiResponse = await callGeminiForAnalysis(sourceCode);

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
 * Call Gemini API to analyze source code
 * Returns structured JSON analysis
 */
async function callGeminiForAnalysis(sourceCode: string): Promise<AIAnalysisResponse> {
  console.log("🤖 Analyzing code with Gemini...");
  console.log("📝 Source code length:", sourceCode.length, "characters");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a code analyzer. Analyze the following code and return a JSON object with this EXACT structure:

{
  "summary": "Brief summary of the analysis (max 2 sentences)",
  "issues": [
    {
      "issueCode": "NESTED_LOOP" | "UNUSED_VARIABLE" | "MAGIC_NUMBER" | "LONG_FUNCTION" | "DUPLICATE_CODE",
      "severity": "low" | "medium" | "high",
      "complexity": "O_1" | "O_n" | "O_n2",
      "functionName": "optional function name where issue is found",
      "startLine": optional line number (integer),
      "endLine": optional line number (integer),
      "beforeSnippet": "optional code snippet showing the issue (max 5 lines)",
      "afterSnippet": "optional suggested fix snippet (max 5 lines)"
    }
  ]
}

RULES:
- issueCode MUST be one of: NESTED_LOOP, UNUSED_VARIABLE, MAGIC_NUMBER, LONG_FUNCTION, DUPLICATE_CODE
- severity MUST be one of: low, medium, high
- complexity MUST be one of: O_1, O_n, O_n2
- Return ONLY valid JSON, no markdown, no explanation
- If no issues found, return empty issues array

CODE TO ANALYZE:
\`\`\`
${sourceCode}
\`\`\``;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean the response (remove markdown code blocks if present)
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    console.log("✅ Gemini response received");

    const parsed = JSON.parse(cleanedText) as AIAnalysisResponse;
    return parsed;
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    
    // Return fallback response on error
    return {
      summary: "Analysis failed - unable to parse code at this time.",
      issues: [],
    };
  }
}
