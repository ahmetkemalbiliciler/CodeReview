import { useState, useEffect } from "react";
import EditorArea from "./EditorArea";
import { projects, versions, ApiError } from "../../services/api";
import { useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import { toast } from "react-toastify";

interface Project {
  id: string;
  name: string;
}

export default function CodeEditor() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isNameVersionModalOpen, setIsNameVersionModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [versionName, setVersionName] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // Not logged in
      const data = await projects.list();
      setProjectList(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const handleCreateProject = () => {
    setNewProjectName("");
    setIsCreateProjectModalOpen(true);
  };

  const submitCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      setIsCreatingProject(true);
      const newProject = await projects.create({ name: newProjectName });
      setProjectList([...projectList, newProject]);
      setSelectedProjectId(newProject.id);
      setIsCreateProjectModalOpen(false);
      toast.success("Project created successfully!");
    } catch (err) {
      toast.error("Error creating project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAnalyze = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedProjectId) {
      toast.warn("Please select or create a project first.");
      return;
    }

    if (!code.trim()) {
      toast.warn("Please enter code to analyze.");
      return;
    }

    setVersionName("");
    setIsNameVersionModalOpen(true);
  };

  const confirmAnalysis = async (useDefaultName: boolean = false) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setIsNameVersionModalOpen(false);

      const finalVersionName = useDefaultName || !versionName.trim()
        ? `${code.slice(0, 20)}...`
        : versionName.trim();

      await versions.create(selectedProjectId, {
        versionLabel: finalVersionName,
        sourceCode: code,
      });

      navigate("/history");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An error occurred during analysis.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-[1024px] flex flex-col gap-8 animate-fade-in-up">
      {/* Heading */}
      <div className="flex flex-col gap-3 text-center md:text-left">
        <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
          Analyze your code <span className="text-accent">instantly</span>
        </h1>
        <p className="text-text-secondary text-base md:text-lg font-normal leading-normal max-w-2xl">
          Paste your code below. Artificial intelligence will detect bugs, security vulnerabilities
          and performance improvements in seconds.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
          {error}
        </div>
      )}

      {/* Editor Code Container - Structure from a.html, Colors from Violet Theme */}
      <div className="group relative flex flex-col w-full rounded-2xl overflow-hidden glass border-glass-border bg-bg-secondary/30 shadow-2xl transition-all duration-500 hover:shadow-accent/10 hover:border-accent/30">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Window Controls */}
            <div className="hidden sm:flex gap-1.5 opacity-60">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            {/* Divider */}
            <div className="hidden sm:block w-px h-4 bg-white/10"></div>

            {/* Language Selector */}

            {/* Project Selector */}
            <div className="flex items-center gap-2 ">
              <div className="relative group">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="appearance-none bg-white/5 hover:bg-white/10 text-text-primary text-xs font-medium rounded-lg border border-white/10 pl-8 pr-8 py-1.5 outline-none focus:border-accent/50 focus:bg-white/10 transition-all cursor-pointer min-w-[140px]"
                >
                  <option value="" disabled className="bg-bg-secondary text-text-secondary">Select Project</option>
                  {projectList.map(p => (
                    <option key={p.id} value={p.id} className="bg-bg-secondary text-text-primary">{p.name}</option>
                  ))}
                </select>
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px]! text-accent opacity-80 pointer-events-none">
                  folder_open
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px]! text-text-secondary pointer-events-none group-hover:text-text-primary transition-colors opacity-70">
                  expand_more
                </span>
              </div>

              <button
                onClick={handleCreateProject}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-300"
                disabled={isLoading}
                title="Create New Project"
              >
                <span className="material-symbols-outlined text-[18px]!">add</span>
              </button>
            </div>
          </div>

          {/* Editor Meta */}
          <div className="flex items-center gap-4 text-text-secondary text-xs font-mono">
            <span className="hidden sm:inline-block hover:text-white cursor-pointer transition-colors opacity-70 hover:opacity-100">
              Auto-detect
            </span>
            <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) {
                    setCode(text);
                    toast.success("Code pasted from clipboard!");
                  }
                } catch {
                  toast.error("Failed to read clipboard. Please allow clipboard access.");
                }
              }}
              className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors opacity-70 hover:opacity-100"
              title="Paste from clipboard"
            >
              <span className="material-symbols-outlined text-[16px]!">
                content_paste
              </span>
              <span className="hidden sm:inline">paste</span>
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <EditorArea code={code} onChange={setCode} />

        {/* Editor Footer Status */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex justify-between items-center text-xs text-text-secondary font-mono">
          <div>Length: {code.length} chars</div>
          <div>Lines: {code.split('\n').length}</div>
        </div>
      </div>

      {/* Action Area - The specific part user wanted to keep */}
      <div className="flex flex-col items-center gap-4 mt-2">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`group flex min-w-[200px] md:min-w-[240px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-8 
            ${isAnalyzing ? 'bg-bg-tertiary border border-accent/20 cursor-wait' : 'bg-accent hover:bg-accent/90 active:scale-95 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]'}
            transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-80`}
        >
          <div className={`text-white mr-2 transition-transform duration-500 ${isAnalyzing ? 'animate-spin' : 'group-hover:rotate-12'}`}>
            <span className="material-symbols-outlined text-[24px]! font-bold">
              {isAnalyzing ? "sync" : "bolt"}
            </span>
          </div>
          <span className="text-white text-lg font-bold leading-normal tracking-[0.015em]">
            {isAnalyzing ? "Analyzing..." : "Submit for Review"}
          </span>
        </button>
        <p className="text-xs text-text-secondary font-medium">
          By submitting, you agree to our{" "}
          <a className="underline hover:text-white transition-colors" href="#">
            Privacy Policy
          </a>{" "}
          .
        </p>
      </div>

      <Modal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        title="Create New Project"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium ml-1">Project Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. My Awesome Project"
              className="w-full bg-black/20 text-text-primary text-sm rounded-xl border border-white/10 px-4 py-3 outline-none focus:border-accent focus:bg-black/30 transition-all placeholder:text-text-secondary/50"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && submitCreateProject()}
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => setIsCreateProjectModalOpen(false)}
              className="px-4 py-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={submitCreateProject}
              disabled={isCreatingProject || !newProjectName.trim()}
              className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-lg shadow-lg shadow-accent/20 transition-all"
            >
              {isCreatingProject ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isNameVersionModalOpen}
        onClose={() => setIsNameVersionModalOpen(false)}
        title="Name this version"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium ml-1">Version Name</label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g. Initial implementation, Bug fix etc."
              className="w-full bg-black/20 text-text-primary text-sm rounded-xl border border-white/10 px-4 py-3 outline-none focus:border-accent focus:bg-black/30 transition-all placeholder:text-text-secondary/50"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && versionName.trim() && confirmAnalysis()}
            />
            <p className="text-[10px] text-text-secondary ml-1 mt-1">
              Give your version a name or skip to use a default one.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => confirmAnalysis(true)}
              className="px-4 py-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Skip & Use Default
            </button>
            <button
              onClick={() => confirmAnalysis()}
              disabled={isAnalyzing || !versionName.trim()}
              className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-lg shadow-lg shadow-accent/20 transition-all"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Now"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

