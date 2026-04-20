
// ─── Agents Module ─────────────────────────────────────────────────────────────
function AgentsModule() {
  const [data, setData] = useState<{ scheduled: Agent[]; heartbeat: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    API.getAgents().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-8 w-32" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" />
    </div>
  );

  const statusIcon = (s: Agent["status"]) => {
    if (s === "done") return <StatusDot status="green" />;
    if (s === "next") return <StatusDot status="yellow" pulse />;
    if (s === "failed") return <StatusDot status="red" />;
    return <StatusDot status="gray" />;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Heartbeat */}
      {data?.heartbeat && (
        <div>
          <SectionHeader title="Heartbeat" />
          <Card className="flex items-center gap-3">
            <StatusDot status={data.heartbeat.status === "active" ? "green" : "gray"} pulse />
            <div>
              <p className="text-sm font-bold text-white capitalize">{data.heartbeat.status || "Unknown"}</p>
              <p className="text-[10px] text-zinc-500">Last cycle: {data.heartbeat.lastCycle || "--"}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Scheduled agents */}
      <div>
        <SectionHeader title="Scheduled Agents" />
        <div className="space-y-2">
          {data?.scheduled?.map(a => (
            <Card key={a.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon(a.status)}
                <div>
                  <p className="text-sm font-bold text-white">{a.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{a.time}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold uppercase ${a.status === "done" ? "text-green-500" : a.status === "next" ? "text-amber-500" : "text-zinc-500"}`}>{a.status}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Memory Module ────────────────────────────────────────────────────────────
function MemoryModule({ setTab }: { setTab: (t: Tab) => void }) {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ name: string; content: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    API.getMemory().then(f => { setFiles(f); setLoading(false); });
  }, []);

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  const sections = [...new Set(filtered.map(f => f.section))];

  const openFile = async (f: MemoryFile) => {
    const content = await API.getMemoryFile(f.path);
    setViewer({ name: f.name, content });
  };

  if (viewer) {
    return (
      <div className="pb-6">
        <TopBar title={viewer.name} showBack onBack={() => setViewer(null)} />
        <div className="p-4">
          <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            {viewer.content.slice(0, 5000)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="px-4 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search memory..." type="search"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500" />
      </div>
      {loading ? (
        <div className="p-4 space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
      ) : (
        sections.map(section => (
          <div key={section} className="mb-4">
            <SectionHeader title={section} />
            <div className="px-4 space-y-1">
              {filtered.filter(f => f.section === section).map(f => (
                <button key={f.path} onClick={() => openFile(f)}
                  className="Card w-full flex items-center gap-3 py-3 hover:bg-zinc-800 transition-colors text-left">
                  <Brain size={14} className="text-zinc-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-zinc-300 truncate">{f.name}</p>
                    <p className="text-[9px] text-zinc-600">{relativeTime(f.mtime)}</p>
                  </div>
                  <ChevronRight size={12} className="text-zinc-700 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
