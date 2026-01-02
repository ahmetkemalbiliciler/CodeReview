import { useState, useEffect } from "react";
import { projects, versions, comparisons } from "../services/api";
import Sidebar from "../components/History/Sidebar";
import ComparisonView from "../components/History/ComparisonView";
import AnalysisView from "../components/History/AnalysisView";
import EmptyState from "../components/History/EmptyState";
import type { Project, Version, Comparison } from "../components/History/types";
import { toast } from "react-toastify";

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
                    toast.warn("You can only compare 2 versions at a time.");
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
            toast.error("Comparison failed. Ensure both versions have been analyzed.");
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
            toast.error("Failed to generate explanation.");
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
            <Sidebar
                projectList={projectList}
                selectedProjectId={selectedProjectId}
                onProjectChange={setSelectedProjectId}
                versionList={versionList}
                selectedVersion={selectedVersion}
                onVersionSelect={handleVersionSelect}
                isCompareMode={isCompareMode}
                onToggleCompareMode={toggleCompareMode}
                selectedForCompare={selectedForCompare}
                onCompare={handleCompare}
                isComparing={isComparing}
                isLoading={isLoading}
            />

            {/* Main Content */}
            <div
                className={`
          flex-1 overflow-y-auto bg-bg-primary/50 relative
          transition-all duration-500 ease-in-out
          ${(selectedVersion || comparisonData) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none md:opacity-100 md:translate-x-0 md:pointer-events-auto'}
        `}
            >
                <div className="p-6 md:p-10 max-w-5xl mx-auto pb-24">
                    {comparisonData ? (
                        <ComparisonView
                            comparisonData={comparisonData}
                            selectedForCompare={selectedForCompare}
                            getVersionLabel={getVersionLabel}
                            onBack={handleBackToNavigator}
                            onGenerateExplanation={handleGenerateExplanation}
                            isExplaining={isExplaining}
                        />
                    ) : (selectedVersion && selectedVersion.analysis) ? (
                        <AnalysisView
                            selectedVersion={selectedVersion}
                            onBack={handleBackToNavigator}
                        />
                    ) : (
                        <EmptyState
                            isCompareMode={isCompareMode}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
