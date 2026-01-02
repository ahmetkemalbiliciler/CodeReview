export interface AnalysisIssue {
    issueCode: string;
    severity: "low" | "medium" | "high";
    complexity: string;
    startLine?: number;
    endLine?: number;
    snippet?: {
        beforeSnippet?: string;
        afterSnippet?: string;
    };
    beforeSnippet?: string;
    afterSnippet?: string;
}

export interface Analysis {
    id: string;
    summary: string;
    issues: AnalysisIssue[];
    createdAt: string;
}

export interface Version {
    id: string;
    versionLabel: string;
    uploadedAt: string;
    analysis?: Analysis;
}

export interface Project {
    id: string;
    name: string;
}

export interface ComparisonResultItem {
    id: string;
    issueCode: string;
    changeType: "IMPROVED" | "UNCHANGED" | "WORSENED";
    beforeSeverity?: string;
    afterSeverity?: string;
    beforeComplexity?: string;
    afterComplexity?: string;
}

export interface AIExplanation {
    explanation: string;
}

export interface Comparison {
    id: string;
    createdAt: string;
    results: ComparisonResultItem[];
    explanation?: AIExplanation;
}
