import CodeIcon from "@mui/icons-material/Code";

interface EmptyStateProps {
    isCompareMode: boolean;
    isLoading: boolean;
}

export default function EmptyState({ isCompareMode, isLoading }: EmptyStateProps) {
    return (
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
    );
}
