
// ─── Home Dashboard ────────────────────────────────────────────────────────────
function HomeDashboard({ setTab }: { setTab: (t: Tab) => void }) {
  const [context, setContext] = useState<ContextData | null>(null);
  const [agents, setAgents] = useState<{ scheduled: Agent[] } | null>(null);
  const [memory, setMemory] = useState<MemoryFile[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ctx, ag, mem, cal] = await Promise.all([
        API.getContext(), API.getAgents(), API.getMemory(), API.getCalendar()
      ]);
      setContext(ctx); setAgents(ag); setMemory(mem.slice(0, 4)); setCalendar(cal);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const nextAgent = agents?.scheduled?.find(a => a.status === "next");

  return (
    <div className="space-y-6 pb-24">
      <div className="pt-4 px-1">
        <h1 className="text-2xl font-bold text-white">{getGreeting()}, Niam.</h1>
        {loading ? <Skeleton className="h-4 w-64 mt-1" /> : (
          <p className="text-zinc-500 text-sm mt-1">{context?.activeContext?.slice(0, 120) || "Your AI OS is ready."}</p>
        )}
      </div>

      <div>
        <SectionHeader title="Active Agents" />
        <div className="grid grid-cols-2 gap-2">
          {loading ? [1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />) : (
            <>
              <Card className="flex items-center gap-3">
                <StatusDot status="green" pulse />
                <div><p className="text-xs font-bold text-white">Zo</p><p className="text-[10px] text-zinc-500">Online</p></div>
              </Card>
              <Card className="flex items-center gap-3">
                <StatusDot status="gray" />
                <div><p className="text-xs font-bold text-white">Hermes</p><p className="text-[10px] text-zinc-500">Desktop only</p></div>
              </Card>
            </>
          )}
        </div>
      </div>

      {nextAgent && (
        <div>
          <SectionHeader title="Next Agent" />
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusDot status="yellow" pulse />
              <div><p className="text-sm font-bold text-white">{nextAgent.name}</p><p className="text-[10px] text-zinc-500 font-mono">{nextAgent.time}</p></div>
            </div>
            <button onClick={() => setTab("agents")} className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">View</button>
          </Card>
        </div>
      )}

      {calendar.length > 0 && (
        <div>
          <SectionHeader title="Today" />
          <div className="space-y-2">{calendar.slice(0, 3).map(ev => (
            <div key={ev.id} className="Card flex items-center gap-3">
              <div className="text-center min-w-[48px]">
                <p className="text-sm font-bold text-white font-mono">{ev.time}</p>
                <p className="text-[9px] text-zinc-600">{ev.duration}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{ev.title}</p>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${ev.type === "internal" ? "text-blue-500" : ev.type === "external" ? "text-green-500" : "text-purple-500"}`}>{ev.type}</span>
              </div>
            </div>
          ))}</div>
        </div>
      )}

      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Home, label: "Home", tab: "home" },
            { icon: Zap, label: "Chat", tab: "chat" },
            { icon: Cpu, label: "Agents", tab: "agents" },
            { icon: Brain, label: "Memory", tab: "memory" },
          ].map(({ icon: Icon, label, tab }) => (
            <button key={tab} onClick={() => setTab(tab as Tab)}
              className="Card flex flex-col items-center gap-2 py-4 text-zinc-400 hover:text-white transition-colors">
              <Icon size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {memory.length > 0 && (
        <div>
          <SectionHeader title="Recent Memory" />
          <div className="space-y-1">{memory.map(f => (
            <button key={f.path} onClick={() => setTab("memory")}
              className="Card w-full flex items-center gap-3 py-3 hover:bg-zinc-800 transition-colors text-left">
              <Brain size={14} className="text-zinc-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-zinc-300 truncate">{f.name}</p>
                <p className="text-[9px] text-zinc-600">{f.section} · {relativeTime(f.mtime)}</p>
              </div>
              <ChevronRight size={12} className="text-zinc-700 shrink-0" />
            </button>
          ))}</div>
        </div>
      )}
    </div>
  );
}

