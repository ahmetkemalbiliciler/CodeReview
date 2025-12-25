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
    const name = window.prompt("Proje adı giriniz:");
    if (!name) return;

    try {
      setIsLoading(true);
      const newProject = await projects.create({ name });
      setProjectList([...projectList, newProject]);
      setSelectedProjectId(newProject.id);
    } catch (err) {
      alert("Proje oluşturulurken hata oluştu");
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
      alert("Lütfen önce bir proje seçin veya oluşturun.");
      return;
    }

    if (!code.trim()) {
      alert("Lütfen analiz edilecek kod girin.");
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
      alert("Analiz tamamlandı! Sonuçlar için Geçmiş sayfasına yönlendiriliyorsunuz.");
      navigate("/history");

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Analiz sırasında bir hata oluştu.");
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
          Kodunu <span className="text-accent">anında</span> analiz et
        </h1>
        <p className="text-text-secondary text-base md:text-lg font-normal leading-normal max-w-2xl">
          Kodunu aşağıya yapıştır. Yapay zekamız hataları, güvenlik açıklarını ve
          performans iyileştirmelerini saniyeler içinde tespit etsin.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
          {error}
        </div>
      )}

      {/* Editor Code Container - Structure from a.html, Colors from Violet Theme */}
      <div className="group relative flex flex-col w-full rounded-2xl overflow-hidden border border-border bg-bg-secondary shadow-2xl transition-all duration-300 hover:shadow-accent/10 hover:border-accent/50">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg-mobile-secondary border-b border-border">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Window Controls */}
            <div className="hidden sm:flex gap-1.5 opacity-60">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            {/* Divider */}
            <div className="hidden sm:block w-px h-4 bg-border"></div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Project Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Proje:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-bg-primary text-text-primary text-xs rounded border border-border px-2 py-1 outline-none focus:border-accent"
              >
                <option value="" disabled>Seçiniz</option>
                {projectList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleCreateProject}
                className="text-accent hover:text-white text-xs font-bold px-2"
                disabled={isLoading}
              >
                + Yeni
              </button>
            </div>
          </div>

          {/* Editor Meta */}
          <div className="flex items-center gap-4 text-text-secondary text-xs font-mono">
            <span className="hidden sm:inline-block hover:text-white cursor-pointer transition-colors">
              Auto-detect
            </span>
            <span className="w-px h-3 bg-border hidden sm:block"></span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]!">
                content_copy
              </span>
              <span className="hidden sm:inline">Kopyala</span>
            </span>
          </div>
        </div>

        {/* Editor Area */}
        <EditorArea code={code} onChange={setCode} />

        {/* Editor Footer Status */}
        <div className="px-4 py-2 bg-bg-mobile-secondary border-t border-border flex justify-between items-center text-xs text-text-secondary font-mono">
          <div>Length: {code.length} chars</div>
          <div>Lines: {code.split('\n').length}</div>
        </div>
      </div>

      {/* Action Area - The specific part user wanted to keep */}
      <div className="flex flex-col items-center gap-4 mt-2">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="group flex min-w-[200px] md:min-w-[240px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-8 bg-accent hover:bg-accent/90 active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-white mr-2 transition-transform duration-300 group-hover:rotate-12">
            <span className="material-symbols-outlined text-[24px]! font-bold">
              {isAnalyzing ? "sync" : "bolt"}
            </span>
          </div>
          <span className="text-white text-lg font-bold leading-normal tracking-[0.015em]">
            {isAnalyzing ? "Analiz Ediliyor..." : "İnceleme için Gönder"}
          </span>
        </button>
        <p className="text-xs text-text-secondary font-medium">
          Göndererek,{" "}
          <a className="underline hover:text-white" href="#">
            Gizlilik Politikamızı
          </a>{" "}
          kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}

