import { Request } from "express";

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// AI Analysis Response Schema
export interface AIAnalysisResponse {
  summary: string;
  issues: AIIssue[];
}

export interface AIIssue {
  issueCode: "NESTED_LOOP" | "UNUSED_VARIABLE" | "MAGIC_NUMBER" | "LONG_FUNCTION" | "DUPLICATE_CODE";
  severity: "low" | "medium" | "high";
  complexity: "O_1" | "O_n" | "O_n2";
  functionName?: string;
  startLine?: number;
  endLine?: number;
  beforeSnippet?: string;
  afterSnippet?: string;
}

// Comparison Result Types
export type ChangeType = "IMPROVED" | "UNCHANGED" | "WORSENED";

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Request Body Types
export interface CreateProjectBody {
  name: string;
  description?: string;
}

export interface UploadVersionBody {
  versionLabel?: string;
  sourceCode: string; // Temporary - only for AI analysis, NOT stored
}

export interface CompareVersionsBody {
  fromVersionId: string;
  toVersionId: string;
}
