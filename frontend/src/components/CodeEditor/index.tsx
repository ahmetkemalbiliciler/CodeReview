import { useState, useEffect } from "react";
import LanguageSelector from "./LanguageSelector";
import EditorArea from "./EditorArea";
import { projects, versions, ApiError } from "../../services/api";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
}

export default function CodeEditor() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
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

  const handleCreateProject = async () => {
    const name = window.prompt("Enter project name:");
    if (!name) return;

    try {
      setIsLoading(true);
      const newProject = await projects.create({ name });
      setProjectList([...projectList, newProject]);
      setSelectedProjectId(newProject.id);
    } catch (err) {
      alert("Error creating project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedProjectId) {
      alert("Please select or create a project first.");
      return;
    }

    if (!code.trim()) {
      alert("Please enter code to analyze.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      // Upload version and trigger analysis
      // Label generation: simpler for now, just timestamp
      const versionLabel = `v-${new Date().toISOString().slice(0, 19)}`;
      await versions.create(selectedProjectId, {
        versionLabel,
        sourceCode: code,
      });

      // Navigate to history to see result (or show modal)
      // For now, let's navigate to history which we will update next
      alert("Analysis complete! Redirecting to History page for results.");
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
            <LanguageSelector />

            {/* Project Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-bg-primary/50 text-text-primary text-xs rounded border border-white/10 px-2 py-1 outline-none focus:border-accent hover:bg-bg-primary/80 transition-colors"
              >
                <option value="" disabled>Select</option>
                {projectList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleCreateProject}
                className="text-accent hover:text-white text-xs font-bold px-2 transition-colors"
                disabled={isLoading}
              >
                + New
              </button>
            </div>
          </div>

          {/* Editor Meta */}
          <div className="flex items-center gap-4 text-text-secondary text-xs font-mono">
            <span className="hidden sm:inline-block hover:text-white cursor-pointer transition-colors opacity-70 hover:opacity-100">
              Auto-detect
            </span>
            <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors opacity-70 hover:opacity-100">
              <span className="material-symbols-outlined text-[16px]!">
                content_copy
              </span>
              <span className="hidden sm:inline">Copy</span>
            </span>
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
    </div>
  );
}

