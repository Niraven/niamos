import { useState, useEffect } from "react";
import { Brain, ArrowLeft, ChevronRight } from "lucide-react";
import { API } from "../lib/api";
import type { MemoryFile } from "../lib/api";
import { SectionHeader, Skeleton } from "../components/ui";
import { renderMarkdown } from "../lib/markdown";

export function Memory() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    API.getMemory().then(d => {
      const all = [
        ...(d.working  || []),
        ...(d.shared   || []),
        ...(d.journal  || []),
        ...(d.strategic|| []),
      ];
      const seen = new Set<string>();
      const unique = all.filter((f: any) => {
        if (seen.has(f.path)) return false;
        seen.add(f.path);
        return true;
      }).slice(0, 20);
      setFiles(unique);
      setLoading(false);
    });
  }, []);

  const openFile = async (f: MemoryFile) => {
    setSelected(f);
    setLoadingContent(true);
    const rawPath = f.path.startsWith("MEMORY/") ? f.path : "MEMORY/" + f.path;
    const text = await API.getMemoryFile(rawPath);
    setContent(text);
    setLoadingContent(false);
  };

  if (selected) return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 flex items-center gap-3 safe-top"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setSelected(null)} className="p-1.5 active:opacity-60">
          <ArrowLeft size={18} style={{ color: "var(--text-2)" }} />
        </button>
        <span className="text-xs font-mono truncate" style={{ color: "var(--text-3)" }}>{selected.path}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {loadingContent
          ? <Skeleton className="h-4 w-full mb-2" />
          : <div className="text-xs leading-relaxed markdown whitespace-pre-wrap"
              style={{ fontFamily: "'SF Mono', ui-monospace, monospace", color: "var(--text-2)" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        }
      </div>
    </div>
  );

  return (
    <div className="pb-24">
      <SectionHeader label="Memory Files" />
      <div className="px-4 space-y-0.5">
        {loading
          ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full mb-1" />)
          : files.map((f, i) => (
            <button key={i} onClick={() => openFile(f)}
              className="w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-all active:opacity-60"
              style={{ minHeight: 44 }}>
              <Brain size={13} className="shrink-0" style={{ color: "var(--text-3)" }} />
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-mono truncate" style={{ color: "var(--text-1)" }}>{f.name}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>{f.path}</p>
              </div>
              <ChevronRight size={12} className="shrink-0" style={{ color: "var(--text-3)" }} />
            </button>
          ))
        }
      </div>
    </div>
  );
}
