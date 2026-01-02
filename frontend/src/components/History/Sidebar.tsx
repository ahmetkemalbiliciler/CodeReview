import CodeIcon from "@mui/icons-material/Code";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import type { Project, Version } from "./types";
import { safeFormatDate } from "./utils";

interface SidebarProps {
    projectList: Project[];
    selectedProjectId: string;
    onProjectChange: (id: string) => void;
    versionList: Version[];
    selectedVersion: Version | null;
    onVersionSelect: (version: Version) => void;
    isCompareMode: boolean;
    onToggleCompareMode: () => void;
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onVersionDelete: (id: string) => void;
    onVersionUpdate: (id: string, newLabel: string) => void;
    selectedForCompare: string[];
    onCompare: () => void;
    isComparing: boolean;
    isLoading: boolean;
}

export default function Sidebar({
    projectList,
    selectedProjectId,
    onProjectChange,
    versionList,
    selectedVersion,
    onVersionSelect,
    isCompareMode,
    onToggleCompareMode,
    isEditMode,
    onToggleEditMode,
    onVersionDelete,
    onVersionUpdate,
    selectedForCompare,
    onCompare,
    isComparing,
    isLoading
}: SidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const startEditing = (e: React.MouseEvent, version: Version) => {
        e.stopPropagation();
        setEditingId(version.id);
        setEditValue(version.versionLabel);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditValue("");
    };

    const saveEditing = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (editValue.trim()) {
            onVersionUpdate(id, editValue.trim());
        }
        setEditingId(null);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onVersionDelete(id);
    };

    return (
        <div
            className={`
      w-full md:w-1/3 min-w-[320px] max-w-full md:max-w-[420px] 
      bg-bg-secondary/50 glass border-r border-glass-border flex flex-col 
      absolute md:static top-0 bottom-0 left-0 z-10 transition-transform duration-300
      ${(selectedVersion) ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
    `}
        >
            <div className="p-6 border-b border-border/50 sticky top-0 z-10 space-y-4 bg-bg-secondary/30 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <CodeIcon className="text-accent" />
                        History
                    </h2>
                    <div className="flex gap-2">
                        {/* Edit Toggle */}
                        <button
                            onClick={onToggleEditMode}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${isEditMode ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'bg-bg-tertiary text-text-secondary hover:text-accent hover:bg-bg-tertiary/80'}`}
                            title="Edit Versions"
                        >
                            <EditIcon fontSize="small" />
                        </button>
                        {/* Compare Toggle */}
                        <button
                            onClick={onToggleCompareMode}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${isCompareMode ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'bg-bg-tertiary text-text-secondary hover:text-accent hover:bg-bg-tertiary/80'}`}
                            title="Compare Versions"
                        >
                            <CompareArrowsIcon fontSize="small" />
                        </button>
                    </div>
                </div>

                {/* Project Selector */}
                <div className="relative">
                    <select
                        value={selectedProjectId}
                        onChange={(e) => onProjectChange(e.target.value)}
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
                            onClick={onCompare}
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
                    const isEditing = editingId === version.id;

                    return (
                        <div
                            key={version.id}
                            onClick={() => !isEditMode && onVersionSelect(version)}
                            className={`p-4 rounded-xl transition-all duration-300 border relative overflow-hidden group
                                ${active
                                    ? "bg-accent/10 border-accent shadow-md"
                                    : "bg-bg-primary/40 border-transparent hover:bg-bg-primary/80 hover:border-border/50"
                                }
                                ${isEditMode ? "cursor-default" : "cursor-pointer"}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    {isCompareMode && (
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                            ${isChosenForCompare ? 'border-accent bg-accent' : 'border-text-secondary/50'}
                                        `}>
                                            {isChosenForCompare && <CheckCircleIcon style={{ fontSize: 14 }} className="text-white" />}
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-hidden">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-bg-primary/80 text-text-primary border border-accent rounded px-2 py-1 text-sm w-full outline-none"
                                                />
                                                <button onClick={(e) => saveEditing(e, version.id)} className="text-accent hover:text-accent/80">
                                                    <CheckIcon fontSize="small" />
                                                </button>
                                                <button onClick={cancelEditing} className="text-text-secondary hover:text-text-primary">
                                                    <CloseIcon fontSize="small" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`font-bold block truncate transition-colors ${active ? 'text-accent' : 'text-text-primary'}`}>
                                                {version.versionLabel}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5">
                                            <span>{safeFormatDate(version.uploadedAt, "MMM d, yyyy")}</span>
                                            <span className="w-1 h-1 rounded-full bg-text-secondary/50"></span>
                                            <span>{safeFormatDate(version.uploadedAt, "HH:mm")}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isEditMode && !isEditing && (
                                        <>
                                            <button
                                                onClick={(e) => startEditing(e, version)}
                                                className="p-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-accent hover:bg-bg-tertiary/80 transition-all"
                                                title="Edit Label"
                                            >
                                                <EditIcon style={{ fontSize: 16 }} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, version.id)}
                                                className="p-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-red-500 hover:bg-bg-tertiary/80 transition-all"
                                                title="Delete Version"
                                            >
                                                <DeleteIcon style={{ fontSize: 16 }} />
                                            </button>
                                        </>
                                    )}
                                    {active && !isCompareMode && !isEditMode && (
                                        <ArrowForwardIosIcon className="text-accent animate-fade-in" style={{ fontSize: 14 }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
