import { useState, useEffect } from "react";
import { format } from "date-fns";
import CodeIcon from "@mui/icons-material/Code";
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
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Sidebar - Navigator */}
            <div
                className={`
          w-full md:w-1/3 min-w-[320px] max-w-full md:max-w-[420px] 
          bg-bg-secondary/50 glass border-r border-glass-border flex flex-col 
          absolute md:static top-0 bottom-0 left-0 z-10 transition-transform duration-300
          ${(selectedVersion || comparisonData) ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}
            >
                <div className="p-6 border-b border-border/50 sticky top-0 z-10 space-y-4 bg-bg-secondary/30 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <CodeIcon className="text-accent" />
                            History
                        </h2>
                        {/* Compare Toggle */}
                        <button
                            onClick={toggleCompareMode}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${isCompareMode ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'bg-bg-tertiary text-text-secondary hover:text-accent hover:bg-bg-tertiary/80'}`}
                            title="Compare Versions"
                        >
                            <CompareArrowsIcon fontSize="small" />
                        </button>
                    </div>

                    {/* Project Selector */}
                    <div className="relative">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full bg-bg-primary/50 text-text-primary border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none appearance-none cursor-pointer hover:bg-bg-primary/80 transition-colors"
                        >
                            {projectList.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                            {projectList.length === 0 && <option disabled>No Projects</option>}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            <ArrowForwardIosIcon style={{ fontSize: 12, transform: 'rotate(90deg)' }} />
                        </div>
                    </div>

                    {/* Comparison Action */}
                    {isCompareMode && (
                        <div className="bg-accent/10 p-4 rounded-xl border border-accent/20 text-center animate-fade-in">
                            <p className="text-sm text-text-secondary mb-3">
                                Select 2 versions ({selectedForCompare.length}/2)
                            </p>
                            <button
                                onClick={handleCompare}
                                disabled={selectedForCompare.length !== 2 || isComparing}
                                className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-accent/20"
                            >
                                {isComparing ? "Comparing..." : "Run Comparison"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                    {isLoading && <div className="text-center text-text-secondary p-4 animate-pulse">Loading versions...</div>}

                    {!isLoading && versionList.length === 0 && (
                        <div className="text-center text-text-secondary p-8 rounded-xl border border-dashed border-border/50">
                            No analysis history found for this project.
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
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border relative overflow-hidden group
                                    ${active
                                        ? "bg-accent/10 border-accent shadow-md"
                                        : "bg-bg-primary/40 border-transparent hover:bg-bg-primary/80 hover:border-border/50"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {isCompareMode && (
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isChosenForCompare ? 'border-accent bg-accent' : 'border-text-secondary/50'}
                                            `}>
                                                {isChosenForCompare && <CheckCircleIcon style={{ fontSize: 14 }} className="text-white" />}
                                            </div>
                                        )}
                                        <div>
                                            <span className={`font-bold block truncate transition-colors ${active ? 'text-accent' : 'text-text-primary'}`}>
                                                {version.versionLabel}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5">
                                                <span>{safeFormatDate(version.uploadedAt, "MMM d, yyyy")}</span>
                                                <span className="w-1 h-1 rounded-full bg-text-secondary/50"></span>
                                                <span>{safeFormatDate(version.uploadedAt, "HH:mm")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {active && !isCompareMode && (
                                        <ArrowForwardIosIcon className="text-accent animate-fade-in" style={{ fontSize: 14 }} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div
                className={`
          flex-1 overflow-y-auto bg-bg-primary/50 relative
          transition-all duration-500 ease-in-out
          ${(selectedVersion || comparisonData) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none md:opacity-100 md:translate-x-0 md:pointer-events-auto'}
        `}
            >
                <div className="p-6 md:p-10 max-w-5xl mx-auto pb-24">
                    {/* Comparison View */}
                    {comparisonData ? (
                        <div className="space-y-8 animate-slide-up">
                            {/* Mobile Back Button */}
                            <div className="md:hidden mb-4">
                                <button
                                    onClick={handleBackToNavigator}
                                    className="flex items-center text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    <ArrowBackIcon className="mr-2" /> Back to Selection
                                </button>
                            </div>

                            <header className="border-b border-white/10 pb-6">
                                <div className="flex items-center gap-2 text-accent mb-3">
                                    <div className="p-1.5 bg-accent/10 rounded-lg">
                                        <CompareArrowsIcon fontSize="small" />
                                    </div>
                                    <span className="font-bold text-xs tracking-wider uppercase opacity-80">Comparison Mode</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                                    Analysis Comparison
                                </h1>
                                <div className="flex items-center gap-3 text-sm mt-3 bg-bg-tertiary/30 w-fit px-4 py-2 rounded-full border border-white/5">
                                    <span className="text-text-primary font-medium">{getVersionLabel(comparisonData.results[0]?.id || selectedForCompare[0])}</span>
                                    <ArrowForwardIosIcon style={{ fontSize: 10 }} className="text-text-secondary" />
                                    <span className="text-text-primary font-medium">{getVersionLabel(comparisonData.results.length > 0 ? (selectedForCompare.find(id => id !== comparisonData?.results[0]?.id) || selectedForCompare[1]) : selectedForCompare[1])}</span>
                                </div>
                            </header>

                            {/* Explanation Section */}
                            <div className="glass-card p-8 border border-glass-border/50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                                    <h3 className="text-text-primary font-bold text-xl flex items-center gap-3">
                                        <AutoFixHighIcon className="text-accent" />
                                        AI Explanation
                                    </h3>
                                    {!comparisonData.explanation && (
                                        <button
                                            onClick={handleGenerateExplanation}
                                            disabled={isExplaining}
                                            className="text-sm bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50 font-semibold"
                                        >
                                            {isExplaining ? "Generating Insights..." : "Generate AI Insights"}
                                        </button>
                                    )}
                                </div>

                                {comparisonData.explanation ? (
                                    <div className="prose prose-invert max-w-none animate-fade-in">
                                        <p className="text-text-primary/90 leading-relaxed whitespace-pre-wrap text-base">
                                            {comparisonData.explanation.explanation}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-text-secondary/70">
                                        {isExplaining ? (
                                            <div className="flex flex-col items-center gap-3 animate-pulse">
                                                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                                <p>Analyzing differences...</p>
                                            </div>
                                        ) : (
                                            <p className="italic">Generate AI insights to understand the key differences between these versions.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Results List */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    <span className="w-1 h-6 bg-accent rounded-full"></span>
                                    Detailed Changes
                                </h3>
                                <div className="grid gap-4">
                                    {comparisonData.results.map((res) => (
                                        <div key={res.id} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2.5 py-1 rounded-md text-[11px] uppercase font-bold tracking-wider border
                                                            ${res.changeType === 'IMPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                res.changeType === 'WORSENED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'}
                                                        `}>
                                                            {res.changeType}
                                                        </span>
                                                        <span className="font-mono font-bold text-text-primary">{res.issueCode}</span>
                                                    </div>
                                                    <div className="text-sm text-text-secondary flex gap-6">
                                                        {res.beforeSeverity && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="opacity-60">Before:</span>
                                                                <span className={`font-medium ${res.beforeSeverity === 'high' ? 'text-red-400' : 'text-text-primary'}`}>{res.beforeSeverity}</span>
                                                            </div>
                                                        )}
                                                        {res.afterSeverity && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="opacity-60">After:</span>
                                                                <span className={`font-medium ${res.afterSeverity === 'high' ? 'text-red-400' : 'text-text-primary'}`}>{res.afterSeverity}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {(res.beforeComplexity && res.afterComplexity && res.beforeComplexity !== res.afterComplexity) && (
                                                        <div className="text-sm bg-bg-tertiary/30 px-3 py-1.5 rounded-lg border border-white/5">
                                                            <span className="text-text-secondary opacity-70">Complexity:</span>{' '}
                                                            <span className="line-through opacity-50 mx-1">{res.beforeComplexity}</span>
                                                            <ArrowForwardIosIcon style={{ fontSize: 10 }} className="inline mx-1 opacity-50" />
                                                            <span className="text-accent font-bold">{res.afterComplexity}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {comparisonData.results.length === 0 && (
                                    <div className="text-center py-12 text-text-secondary border border-dashed border-border/50 rounded-2xl bg-bg-primary/30">
                                        No significant code issues changed between these versions.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (selectedVersion && selectedVersion.analysis) ? (
                        <div className="space-y-8 animate-slide-up">
                            {/* Mobile Back Button */}
                            <div className="md:hidden mb-4">
                                <button
                                    onClick={handleBackToNavigator}
                                    className="flex items-center text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    <ArrowBackIcon className="mr-2" /> Back to List
                                </button>
                            </div>

                            {/* Header */}
                            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
                                        <span className="opacity-60">Version Label</span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2 break-all bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                        {selectedVersion.versionLabel}
                                    </h1>
                                    <p className="text-text-secondary flex items-center gap-2 text-sm">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Analyzed on {safeFormatDate(selectedVersion.uploadedAt, "MMMM d, yyyy 'at' HH:mm")}
                                    </p>
                                </div>
                            </header>

                            {/* AI Summary */}
                            <div className="glass-card p-8 border border-glass-border/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>
                                <h3 className="text-accent font-bold text-lg mb-4 flex items-center gap-2">
                                    <AutoFixHighIcon /> Analysis Summary
                                </h3>
                                <p className="text-text-primary/90 leading-relaxed text-base whitespace-pre-wrap">
                                    {selectedVersion.analysis.summary}
                                </p>
                            </div>

                            {/* Issues List (Cons) */}
                            {selectedVersion.analysis.issues && selectedVersion.analysis.issues.length > 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 mt-8">
                                        <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                                        Detected Issues ({selectedVersion.analysis.issues.length})
                                    </h3>

                                    <div className="grid gap-6">
                                        {selectedVersion.analysis.issues.map((issue, idx) => (
                                            <div key={idx} className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                                <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="font-mono text-base font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/10">{issue.issueCode}</span>
                                                        </div>
                                                        <div className="text-sm text-text-secondary mt-2">
                                                            Complexity: <span className="text-text-primary font-mono bg-bg-tertiary/50 px-1.5 py-0.5 rounded">{issue.complexity}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-3 py-1.5 rounded-full uppercase font-bold tracking-wider border
                                                        ${issue.severity === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10 shadow-lg' :
                                                            issue.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        }`}>
                                                        {issue.severity} Severity
                                                    </span>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4 mt-6">
                                                    {(issue.snippet?.beforeSnippet || issue.beforeSnippet) && (
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1">Target Code</div>
                                                            <div className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto border border-red-500/20 shadow-inner">
                                                                <pre className="text-xs font-mono text-gray-300 leading-relaxed"><code>{issue.snippet?.beforeSnippet || issue.beforeSnippet}</code></pre>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(issue.snippet?.afterSnippet || issue.afterSnippet) && (
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider pl-1 text-green-400">Suggested Fix</div>
                                                            <div className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto border border-green-500/20 shadow-inner group-hover:shadow-green-500/5 transition-shadow">
                                                                <pre className="text-xs font-mono text-green-400 leading-relaxed"><code>{issue.snippet?.afterSnippet || issue.afterSnippet}</code></pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                            {!isLoading && (
                                <div className="text-center animate-fade-in max-w-md p-8 glass rounded-3xl border border-white/5">
                                    <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6 text-text-tertiary">
                                        <CodeIcon style={{ fontSize: 40 }} className="opacity-50" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">No Version Selected</h3>
                                    <p className="text-text-secondary leading-relaxed">
                                        {isCompareMode
                                            ? "Please select two versions from the sidebar to generate a comparison report."
                                            : "Select a version from the history list to view detailed analysis and AI insights."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
