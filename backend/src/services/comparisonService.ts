import prisma from "../utils/prisma.js";
import type { ChangeType } from "../types/index.js";
import type { Severity, Complexity, IssueCode, AnalysisIssue } from "../generated/prisma/client.js";

// Severity ranking for comparison (lower = better)
const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

// Complexity ranking for comparison (lower = better)
const COMPLEXITY_RANK: Record<Complexity, number> = {
  O_1: 1,
  O_n: 2,
  O_n2: 3,
};

export const comparisonService = {
  /**
   * Compare two analysis results deterministically
   * Returns comparison with change type for each issue
   */
  async compareAnalyses(
    projectId: string,
    fromAnalysisId: string,
    toAnalysisId: string
  ) {
    // Fetch both analyses with their issues
    const [fromAnalysis, toAnalysis] = await Promise.all([
      prisma.analysisResult.findUnique({
        where: { id: fromAnalysisId },
        include: { issues: true },
      }),
      prisma.analysisResult.findUnique({
        where: { id: toAnalysisId },
        include: { issues: true },
      }),
    ]);

    if (!fromAnalysis || !toAnalysis) {
      throw new Error("One or both analyses not found");
    }

    // Group issues by issueCode for comparison
    const fromIssuesByCode = groupIssuesByCode(fromAnalysis.issues);
    const toIssuesByCode = groupIssuesByCode(toAnalysis.issues);

    // Get all unique issue codes
    const allIssueCodes = new Set([
      ...Object.keys(fromIssuesByCode),
      ...Object.keys(toIssuesByCode),
    ]) as Set<IssueCode>;

    // Determine change type for each issue code
    const comparisonResults: {
      issueCode: IssueCode;
      changeType: ChangeType;
      beforeSeverity?: Severity;
      beforeComplexity?: Complexity;
      afterSeverity?: Severity;
      afterComplexity?: Complexity;
    }[] = [];

    for (const issueCode of allIssueCodes) {
      const fromIssue = fromIssuesByCode[issueCode];
      const toIssue = toIssuesByCode[issueCode];

      const changeType = determineChangeType(fromIssue, toIssue);

      comparisonResults.push({
        issueCode: issueCode as IssueCode,
        changeType,
        beforeSeverity: fromIssue?.severity,
        beforeComplexity: fromIssue?.complexity,
        afterSeverity: toIssue?.severity,
        afterComplexity: toIssue?.complexity,
      });
    }

    // Store comparison in database
    const comparison = await prisma.comparison.create({
      data: {
        projectId,
        fromAnalysisId,
        toAnalysisId,
        results: {
          create: comparisonResults,
        },
      },
      include: {
        results: true,
      },
    });

    return comparison;
  },

  /**
   * Get a comparison by ID
   */
  async getById(id: string) {
    return prisma.comparison.findUnique({
      where: { id },
      include: {
        results: true,
        explanation: true,
      },
    });
  },

  /**
   * Verify comparison belongs to a project owned by user
   */
  async verifyOwnership(comparisonId: string, ownerId: string) {
    const comparison = await prisma.comparison.findUnique({
      where: { id: comparisonId },
      include: {
        project: true,
      },
    });

    return comparison && comparison.project.ownerId === ownerId ? comparison : null;
  },

  /**
   * Find existing comparison by fromAnalysisId and toAnalysisId
   * Used for caching - if comparison exists, return it instead of creating new
   */
  async findExisting(fromAnalysisId: string, toAnalysisId: string) {
    return prisma.comparison.findFirst({
      where: {
        fromAnalysisId,
        toAnalysisId,
      },
      include: {
        results: true,
        explanation: true,
      },
    });
  },

  /**
   * Get all comparisons for a project
   */
  async findByProject(projectId: string) {
    return prisma.comparison.findMany({
      where: { projectId },
      include: {
        results: true,
        explanation: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
};

/**
 * Group issues by issueCode
 * Takes the most severe instance if multiple exist
 */
function groupIssuesByCode(
  issues: AnalysisIssue[]
): Record<string, AnalysisIssue> {
  const grouped: Record<string, AnalysisIssue> = {};

  for (const issue of issues) {
    const existing = grouped[issue.issueCode];
    const issueSeverityRank = SEVERITY_RANK[issue.severity as Severity];
    const existingSeverityRank = existing ? SEVERITY_RANK[existing.severity as Severity] : undefined;
    
    if (!existing || (issueSeverityRank !== undefined && existingSeverityRank !== undefined && issueSeverityRank > existingSeverityRank)) {
      grouped[issue.issueCode] = issue;
    }
  }

  return grouped;
}

/**
 * DETERMINISTIC COMPARISON LOGIC
 * AI is NOT involved in this decision - purely algorithmic
 * 
 * Rules:
 * - Issue removed → IMPROVED
 * - Issue added → WORSENED
 * - Severity decreased → IMPROVED
 * - Severity increased → WORSENED
 * - Complexity decreased → IMPROVED
 * - Complexity increased → WORSENED
 * - Otherwise → UNCHANGED
 */
function determineChangeType(
  fromIssue: AnalysisIssue | undefined,
  toIssue: AnalysisIssue | undefined
): ChangeType {
  // Issue was removed → IMPROVED
  if (fromIssue && !toIssue) {
    return "IMPROVED";
  }

  // Issue was added → WORSENED
  if (!fromIssue && toIssue) {
    return "WORSENED";
  }

  // Both exist - compare severity and complexity
  if (fromIssue && toIssue) {
    const toSeverityRank = SEVERITY_RANK[toIssue.severity as Severity];
    const fromSeverityRank = SEVERITY_RANK[fromIssue.severity as Severity];
    const toComplexityRank = COMPLEXITY_RANK[toIssue.complexity as Complexity];
    const fromComplexityRank = COMPLEXITY_RANK[fromIssue.complexity as Complexity];

    if (toSeverityRank === undefined || fromSeverityRank === undefined ||
        toComplexityRank === undefined || fromComplexityRank === undefined) {
      return "UNCHANGED";
    }

    const severityChange = toSeverityRank - fromSeverityRank;
    const complexityChange = toComplexityRank - fromComplexityRank;

    // Severity decreased → IMPROVED
    if (severityChange < 0) {
      return "IMPROVED";
    }

    // Severity increased → WORSENED
    if (severityChange > 0) {
      return "WORSENED";
    }

    // Severity same, check complexity
    if (complexityChange < 0) {
      return "IMPROVED";
    }

    if (complexityChange > 0) {
      return "WORSENED";
    }

    // Both same → UNCHANGED
    return "UNCHANGED";
  }

  // Should not reach here
  return "UNCHANGED";
}
