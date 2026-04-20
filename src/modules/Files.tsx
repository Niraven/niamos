import { useState, useEffect, useCallback } from "react";
import { Folder, FileText, ArrowLeft, ChevronRight } from "lucide-react";
import { API } from "../lib/api";
import type { FileEntry } from "../lib/api";
import { SectionHeader, Skeleton } from "../components/ui";
import { renderMarkdown } from "../lib/markdown";

function formatSize(bytes: number) {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

export function Files() {
  const [path, setPath] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ name: string; content: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await API.getFiles(path || undefined);
    const sorted = Array.isArray(data)
      ? [...data].sort((a: FileEntry, b: FileEntry) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        })
      : [];
    setFiles(sorted);
    setLoading(false);
  }, [path]);

  useEffect(() => { load(); }, [load]);

  const openFile = async (f: FileEntry) => {
    if (f.isDir) { setPath(p => p ? `${p}/${f.name}` : f.name); return; }
    const filePath = path ? `${path}/${f.name}` : f.name;
    const raw = await API.getFileContent(filePath);
    try {
      const parsed = JSON.parse(raw);
      setViewer({ name: f.name, content: parsed.content ?? raw });
    } catch {
      setViewer({ name: f.name, content: raw });
    }
  };

  const crumbs = path ? path.split("/") : [];

  if (viewer) return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setViewer(null)} className="p-1.5 active:opacity-60">
          <ArrowLeft size={18} style={{ color: "var(--text-2)" }} />
        </button>
        <span className="text-xs font-mono truncate" style={{ color: "var(--text-3)" }}>{viewer.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        <div className="text-xs leading-relaxed markdown overflow-x-auto"
          style={{ fontFamily: "'SF Mono', ui-monospace, monospace", color: "var(--text-2)", whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(viewer.content.slice(0, 10000)) }}
        />
      </div>
    </div>
  );

  return (
    <div className="pb-24">
      {/* Breadcrumb */}
      {crumbs.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => setPath("")}
            className="text-xs shrink-0 active:opacity-60" style={{ color: "var(--text-3)" }}>
            Workspace
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              <ChevronRight size={10} style={{ color: "var(--text-3)" }} />
              <button onClick={() => setPath(crumbs.slice(0, i + 1).join("/"))}
                className="text-xs active:opacity-60"
                style={{ color: i === crumbs.length - 1 ? "var(--text-1)" : "var(--text-3)" }}>
                {c}
              </button>
            </span>
          ))}
        </div>
      )}

      {crumbs.length > 0 && (
        <button onClick={() => setPath(p => { const i = p.lastIndexOf("/"); return i >= 0 ? p.slice(0, i) : ""; })}
          className="px-4 py-2 flex items-center gap-2 text-xs active:opacity-60"
          style={{ color: "var(--text-3)" }}>
          <ArrowLeft size={12} /> Back
        </button>
      )}

      <SectionHeader label={path || "Workspace"} />
      <div className="px-4 space-y-0.5">
        {loading
          ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full mb-1" />)
          : files.map((f, i) => (
            <button key={i} onClick={() => openFile(f)}
              className="w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-all active:opacity-60"
              style={{ minHeight: 44 }}>
              {f.isDir
                ? <Folder size={14} className="shrink-0" style={{ color: "var(--accent)" }} />
                : <FileText size={14} className="shrink-0" style={{ color: "var(--text-3)" }} />
              }
              <span className="flex-1 text-left text-xs truncate"
                style={{ color: f.isDir ? "var(--text-1)" : "var(--text-2)", fontWeight: f.isDir ? 700 : 400 }}>
                {f.name}
              </span>
              <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--text-3)" }}>
                {f.isDir ? "" : formatSize(f.size)}
              </span>
            </button>
          ))
        }
      </div>
    </div>
  );
}
