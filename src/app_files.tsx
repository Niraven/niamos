
// ─── Files Module ──────────────────────────────────────────────────────────────
function FilesModule() {
  const [path, setPath] = useState<string[]>("MEMORY");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ name: string; content: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const currentPath = path.join("/");
n    const data = await API.getFiles(currentPath || undefined);
    setFiles(data.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    }));
    setLoading(false);
  }, [path.join("/")]);

  useEffect(() => { load(); }, [load]);

  const navigate = (name: string, isDir: boolean) => {
    if (isDir) setPath(p => [...p, name]);
  };

  const navigateUp = () => setPath(p => p.slice(0, -1));

  const openFile = async (f: FileEntry) => {
    if (f.isDir) { navigate(f.name, true); return; }
    const currentPath = [...path, f.name].join("/");
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(currentPath)}`);
      if (res.ok) {
        const text = await res.text();
        setViewer({ name: f.name, content: text.slice(0, 10000) });
      }
    } catch {}
  };

  const breadcrumbs = path.map((p, i) => ({ name: p, parts: path.slice(0, i + 1) }));

  if (viewer) {
    return (
      <div className="pb-6">
        <TopBar title={viewer.name} showBack onBack={() => setViewer(null)} />
        <div className="p-4">
          <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
            {viewer.content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Breadcrumb */}
      <div className="px-4 py-2 flex items-center gap-1 text-xs font-mono text-zinc-500 overflow-x-auto">
        <button onClick={() => setPath([])} className="hover:text-white shrink-0">/</button>
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-1 shrink-0">
            <span className="text-zinc-700">/</span>
            <button onClick={() => setPath(b.parts)} className={`hover:text-white ${i === breadcrumbs.length - 1 ? "text-white font-bold" : ""}`}>{b.name}</button>
          </span>
        ))}
        {path.length > 0 && (
          <button onClick={navigateUp} className="ml-auto text-zinc-600 hover:text-zinc-400 shrink-0">↑ up</button>
        )}
      </div>

      {loading ? (
        <div className="p-4 space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
      ) : files.length === 0 ? (
        <div className="p-8 text-center text-zinc-600 text-sm">Empty directory</div>
      ) : (
        <div className="px-4 space-y-0.5">
          {files.map(f => (
            <button key={f.path} onClick={() => openFile(f)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left rounded-xl">
              {f.isDir ? (
                <FolderOpen size={16} className="text-zinc-500 shrink-0" />
              ) : (
                <FileText size={16} className="text-zinc-600 shrink-0" />
              )}
              <span className={`flex-1 text-sm truncate ${f.isDir ? "font-bold text-zinc-300" : "text-zinc-400"}`}>{f.name}</span>
              <span className="text-[10px] text-zinc-700 font-mono shrink-0">
                {f.isDir ? "" : f.size > 1024 ? `${Math.round(f.size/1024)}KB` : `${f.size}B`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

