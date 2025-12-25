import { useState, useEffect } from "react";
import { format } from "date-fns";
import CodeIcon from "@mui/icons-material/Code";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { projects, versions, comparisons } from "../services/api";

interface AnalysisIssue {
    issueCode: string;
    severity: "low" | "medium" | "high";
    complexity: string;
    startLine?: number;
    endLine?: number;
    // Backend returns nested snippet object
    snippet?: {
        beforeSnippet?: string;
        afterSnippet?: string;
    };
    // Legacy support if flattened
    beforeSnippet?: string;
    afterSnippet?: string;
}

interface Analysis {
    id: string;
    summary: string;
    issues: AnalysisIssue[];
    createdAt: string;
}

interface Version {
    id: string;
    versionLabel: string;
    uploadedAt: string;
    analysis?: Analysis;
}

interface Project {
    id: string;
    name: string;
}

interface ComparisonResultItem {
    id: string;
    issueCode: string;
    changeType: "IMPROVED" | "UNCHANGED" | "WORSENED";
    beforeSeverity?: string;
    afterSeverity?: string;
    beforeComplexity?: string;
    afterComplexity?: string;
}

interface AIExplanation {
    explanation: string;
}

interface Comparison {
    id: string;
    createdAt: string;
    results: ComparisonResultItem[];
    explanation?: AIExplanation;
}

// Helper to safely format dates
const safeFormatDate = (dateString: string | undefined, formatStr: string) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return format(date, formatStr);
    } catch (e) {
        return "Error";
    }
};

export default function History() {
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [versionList, setVersionList] = useState<Version[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Comparison State
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonData, setComparisonData] = useState<Comparison | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);

    // Fetch Projects
    useEffect(() => {
        projects.list().then((data) => {
            setProjectList(data);
            if (data.length > 0) {
                setSelectedProjectId(data[0].id);
            }
        }).catch(console.error);
    }, []);

    // Fetch Versions when Project changes
    useEffect(() => {
        if (!selectedProjectId) return;

        setIsLoading(true);
        // Reset states
        setSelectedVersion(null);
        setComparisonData(null);
        setIsCompareMode(false);
        setSelectedForCompare([]);

        versions.list(selectedProjectId).then(async (data) => {
            const sorted = data.sort((a: any, b: any) =>
                new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
            setVersionList(sorted);
        }).catch(console.error).finally(() => setIsLoading(false));
    }, [selectedProjectId]);

    const handleVersionSelect = async (version: Version) => {
        if (isCompareMode) {
            // Toggle selection for comparison
            if (selectedForCompare.includes(version.id)) {
                setSelectedForCompare(prev => prev.filter(id => id !== version.id));
            } else {
                if (selectedForCompare.length < 2) {
                    setSelectedForCompare(prev => [...prev, version.id]);
                } else {
                    // Replace the oldest selection or just alert?
                    // Let's just prevent > 2
                    alert("You can only compare 2 versions at a time.");
                }
            }
            return;
        }

        // Normal view mode
        setComparisonData(null);
        // Normal view mode
        setComparisonData(null);
        setIsLoading(true);
        try {
            const fullVersion = await versions.get(version.id);
            setSelectedVersion(fullVersion);
        } catch (e) {
            console.error(e);
            // Fallback to local version if fetch fails
            setSelectedVersion(version);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCompareMode = () => {
        setIsCompareMode(!isCompareMode);
        setSelectedForCompare([]);
        setComparisonData(null);
        if (!isCompareMode) {
            setSelectedVersion(null);
        }
    };

    const handleCompare = async () => {
        if (selectedForCompare.length !== 2) return;

        setIsComparing(true);
        // Sort: Older first (from), Newer second (to)
        const v1 = versionList.find(v => v.id === selectedForCompare[0]);
        const v2 = versionList.find(v => v.id === selectedForCompare[1]);

        if (!v1 || !v2) return;

        const date1 = new Date(v1.uploadedAt).getTime();
        const date2 = new Date(v2.uploadedAt).getTime();

        const fromVersionId = date1 < date2 ? v1.id : v2.id;
        const toVersionId = date1 < date2 ? v2.id : v1.id;

        try {
            const result = await comparisons.create(selectedProjectId, {
                fromVersionId,
                toVersionId
            });
            setComparisonData(result);
        } catch (error) {
            console.error(error);
            alert("Comparison failed. Ensure both versions have been analyzed.");
        } finally {
            setIsComparing(false);
        }
    };

    const handleGenerateExplanation = async () => {
        if (!comparisonData) return;
        setIsExplaining(true);
        try {
            const explanation = await comparisons.explain(comparisonData.id);
            setComparisonData(prev => prev ? { ...prev, explanation } : null);
        } catch (error) {
            console.error(error);
            alert("Failed to generate explanation.");
        } finally {
            setIsExplaining(false);
        }
    };

    const handleBackToNavigator = () => {
        setSelectedVersion(null);
        setComparisonData(null);
    };

    // Helper to get version label by ID
    const getVersionLabel = (id: string) => {
        return versionList.find(v => v.id === id)?.versionLabel || "Unknown";
    };

    return (
        <div className="flex h-[calc(100vh-80px)] bg-bg-primary overflow-hidden relative">
            {/* Sidebar - Navigator */}
            <div
                className={`
          w-full md:w-1/3 min-w-[300px] max-w-full md:max-w-[400px] 
          bg-bg-secondary border-r border-border flex flex-col 
          absolute md:static top-0 bottom-0 left-0 z-10 transition-transform duration-300
          ${(selectedVersion || comparisonData) ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}
            >
                <div className="p-4 border-b border-border bg-bg-secondary sticky top-0 z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <CodeIcon className="text-accent" />
                            History
                        </h2>
                        {/* Compare Toggle */}
                        <button
                            onClick={toggleCompareMode}
                            className={`p-2 rounded-full transition-colors ${isCompareMode ? 'bg-accent text-white' : 'text-text-secondary hover:text-accent'}`}
                            title="Compare Versions"
                        >
                            <CompareArrowsIcon fontSize="small" />
                        </button>
                    </div>

                    {/* Project Selector */}
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full bg-bg-primary text-text-primary border border-border rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
                    >
                        {projectList.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        {projectList.length === 0 && <option disabled>No Projects</option>}
                    </select>

                    {/* Comparison Action */}
                    {isCompareMode && (
                        <div className="bg-bg-primary/50 p-2 rounded-lg border border-border text-center">
                            <p className="text-xs text-text-secondary mb-2">
                                Select 2 versions ({selectedForCompare.length}/2)
                            </p>
                            <button
                                onClick={handleCompare}
                                disabled={selectedForCompare.length !== 2 || isComparing}
                                className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-xs font-bold py-2 rounded transition-colors"
                            >
                                {isComparing ? "Comparing..." : "Run Comparison"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                    {isLoading && <div className="text-center text-text-secondary p-4">Yükleniyor...</div>}

                    {!isLoading && versionList.length === 0 && (
                        <div className="text-center text-text-secondary p-4 text-sm">
                            Bu projede henüz analiz yok.
                        </div>
                    )}

                    {versionList.map((version) => {
                        const isSelected = selectedVersion?.id === version.id;
                        const isChosenForCompare = selectedForCompare.includes(version.id);
                        const active = isCompareMode ? isChosenForCompare : isSelected;

                        return (
                            <div
                                key={version.id}
                                onClick={() => handleVersionSelect(version)}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border group 
                                    ${active
                                        ? "bg-accent/10 border-accent shadow-md md:transform md:scale-[1.01]"
                                        : "bg-bg-primary border-border hover:border-text-secondary hover:shadow-sm"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {isCompareMode && (
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                                ${isChosenForCompare ? 'border-accent bg-accent' : 'border-text-secondary'}
                                            `}>
                                                {isChosenForCompare && <CheckCircleIcon style={{ fontSize: 12 }} className="text-white" />}
                                            </div>
                                        )}
                                        <span className="font-semibold text-text-primary truncate">
                                            {version.versionLabel}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end text-text-secondary text-xs pl-6">
                                    <span>{safeFormatDate(version.uploadedAt, "P")}</span>
                                    <span>{safeFormatDate(version.uploadedAt, "p")}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div
                className={`
          flex-1 overflow-y-auto bg-bg-primary p-4 md:p-8 custom-scrollbar
          absolute md:static top-0 bottom-0 right-0 left-0 md:left-auto 
          transition-transform duration-300 bg-bg-primary z-20 md:z-auto
          ${(selectedVersion || comparisonData) ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
            >
                {/* Comparison View */}
                {comparisonData && (
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {/* Mobile Back Button */}
                        <div className="md:hidden mb-4">
                            <button
                                onClick={handleBackToNavigator}
                                className="flex items-center text-text-secondary hover:text-text-primary"
                            >
                                <ArrowBackIcon className="mr-2" /> Back to Selection
                            </button>
                        </div>

                        <header className="border-b border-border/50 pb-4 mb-8">
                            <div className="flex items-center gap-2 text-accent mb-2">
                                <CompareArrowsIcon />
                                <span className="font-bold text-sm tracking-wide uppercase">Comparison Result</span>
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">
                                Comparison Report
                            </h1>
                            <p className="text-text-secondary text-sm mt-1">
                                Comparing <span className="text-text-primary font-medium">{getVersionLabel(comparisonData.results[0]?.id || selectedForCompare[0])}</span> vs <span className="text-text-primary font-medium">{getVersionLabel(comparisonData.results.length > 0 ? (selectedForCompare.find(id => id !== comparisonData?.results[0]?.id) || selectedForCompare[1]) : selectedForCompare[1])}</span>
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                Generated on {safeFormatDate(comparisonData.createdAt, "MMMM d, yyyy")}
                            </p>
                        </header>

                        {/* Explanation Section */}
                        <div className="bg-bg-secondary/50 glass rounded-2xl p-6 border border-glass-border">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-text-primary font-bold text-lg flex items-center gap-2">
                                    <AutoFixHighIcon className="text-accent" /> AI Explanation
                                </h3>
                                {!comparisonData.explanation && (
                                    <button
                                        onClick={handleGenerateExplanation}
                                        disabled={isExplaining}
                                        className="text-xs bg-accent/20 hover:bg-accent/30 text-accent px-3 py-1.5 rounded-full transition-colors font-medium border border-accent/20"
                                    >
                                        {isExplaining ? "Generating..." : "Generate Explanation"}
                                    </button>
                                )}
                            </div>

                            {comparisonData.explanation ? (
                                <p className="text-text-primary leading-relaxed text-sm whitespace-pre-wrap">
                                    {comparisonData.explanation.explanation}
                                </p>
                            ) : (
                                <p className="text-text-secondary text-sm italic">
                                    Click generating explanation to get AI insights on the differences.
                                </p>
                            )}
                        </div>

                        {/* Results List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-text-primary">Detailed Changes</h3>
                            {comparisonData.results.map((res) => (
                                <div key={res.id} className="bg-bg-primary/50 p-4 rounded-xl border border-border flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                                                ${res.changeType === 'IMPROVED' ? 'bg-green-500/20 text-green-500' :
                                                    res.changeType === 'WORSENED' ? 'bg-red-500/20 text-red-500' :
                                                        'bg-gray-500/20 text-gray-500'}
                                            `}>
                                                {res.changeType}
                                            </span>
                                            <span className="font-mono font-bold text-text-primary text-sm">{res.issueCode}</span>
                                        </div>
                                        <div className="text-xs text-text-secondary flex gap-4">
                                            {res.beforeSeverity && <span>Before: <span className="text-text-primary">{res.beforeSeverity}</span></span>}
                                            {res.afterSeverity && <span>After: <span className="text-text-primary">{res.afterSeverity}</span></span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {(res.beforeComplexity && res.afterComplexity && res.beforeComplexity !== res.afterComplexity) && (
                                            <div className="text-xs text-text-secondary">
                                                Complexity: <span className="line-through opacity-50">{res.beforeComplexity}</span> → <span className="text-accent font-bold">{res.afterComplexity}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {comparisonData.results.length === 0 && (
                                <div className="text-center p-8 text-text-secondary border border-border dashed rounded-xl">
                                    No significant changes detected between these versions.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Normal Version Detail View */}
                {!comparisonData && selectedVersion && selectedVersion.analysis && (
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {/* Mobile Back Button */}
                        <div className="md:hidden mb-4">
                            <button
                                onClick={handleBackToNavigator}
                                className="flex items-center text-text-secondary hover:text-text-primary"
                            >
                                <ArrowBackIcon className="mr-2" /> Back to List
                            </button>
                        </div>

                        {/* Header */}
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/50">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2 break-all">
                                    {selectedVersion.versionLabel}
                                </h1>
                                <p className="text-text-secondary flex items-center gap-2 text-sm">
                                    <span>{safeFormatDate(selectedVersion.uploadedAt, "MMMM d, yyyy 'at' HH:mm")}</span>
                                </p>
                            </div>
                        </header>

                        {/* AI Summary */}
                        <div className="bg-bg-secondary/50 glass rounded-2xl p-6 border border-glass-border">
                            <h3 className="text-accent font-bold text-lg mb-4">AI Analysis Summary</h3>
                            <p className="text-text-primary leading-relaxed text-sm whitespace-pre-wrap">
                                {selectedVersion.analysis.summary}
                            </p>
                        </div>

                        {/* Issues List (Cons) */}
                        {selectedVersion.analysis.issues && selectedVersion.analysis.issues.length > 0 && (
                            <div className="bg-bg-secondary/50 glass rounded-2xl p-6 border border-glass-border">
                                <h3 className="text-red-500 font-bold text-lg mb-4 flex items-center gap-2">
                                    <CancelIcon fontSize="small" /> Detected Issues
                                </h3>
                                <div className="space-y-4">
                                    {selectedVersion.analysis.issues.map((issue, idx) => (
                                        <div key={idx} className="bg-bg-primary/50 p-4 rounded-lg border border-border">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono text-sm text-red-400 font-bold">{issue.issueCode}</span>
                                                <span className={`text-xs px-2 py-1 rounded capitalize ${issue.severity === 'high' ? 'bg-red-500/20 text-red-500' :
                                                    issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-blue-500/20 text-blue-500'
                                                    }`}>
                                                    {issue.severity}
                                                </span>
                                            </div>
                                            <div className="text-xs text-text-secondary mb-2">
                                                Complexity: <span className="text-text-primary font-mono">{issue.complexity}</span>
                                            </div>

                                            {(issue.snippet?.beforeSnippet || issue.beforeSnippet) && (
                                                <div className="mt-3">
                                                    <div className="text-xs text-text-secondary mb-1">Problematic Code:</div>
                                                    <div className="bg-[#1e1e1e] rounded p-2 overflow-x-auto border border-red-500/20">
                                                        <pre className="text-xs font-mono text-gray-300"><code>{issue.snippet?.beforeSnippet || issue.beforeSnippet}</code></pre>
                                                    </div>
                                                </div>
                                            )}

                                            {(issue.snippet?.afterSnippet || issue.afterSnippet) && (
                                                <div className="mt-3">
                                                    <div className="text-xs text-text-secondary mb-1">Suggested Fix:</div>
                                                    <div className="bg-[#1e1e1e] rounded p-2 overflow-x-auto border border-green-500/20">
                                                        <pre className="text-xs font-mono text-green-400"><code>{issue.snippet?.afterSnippet || issue.afterSnippet}</code></pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!comparisonData && (!selectedVersion || !selectedVersion.analysis) && (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50">
                        {isLoading ? <p>Yükleniyor...</p> : (
                            <>
                                <ArrowForwardIosIcon style={{ fontSize: 64 }} className="mb-4" />
                                <p className="text-xl font-medium">
                                    {isCompareMode
                                        ? "Select 2 versions to start comparison"
                                        : "Select a version to see details"}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

