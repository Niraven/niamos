// ─── Small Components ─────────────────────────────────────────────────────────
function StatusDot({ status, pulse }: { status: "green" | "yellow" | "red" | "gray"; pulse?: boolean }) {
  const colors: Record<string, string> = { green: "bg-green-500", yellow: "bg-amber-500", red: "bg-red-500", gray: "bg-zinc-600" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${pulse ? "animate-pulse" : ""}`} />;
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">{title}</h3>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className}`} />;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-4 ${className}`}>{children}</div>;
}

// ─── Bottom Nav ──────────────────────────────────────────────────────────────
const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "chat", icon: Zap, label: "Chat" },
  { id: "agents", icon: Cpu, label: "Agents" },
  { id: "memory", icon: Brain, label: "Memory" },
  { id: "files", icon: Files, label: "Files" },
];

function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-50">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => onChange(id)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${active === id ? "text-blue-500" : "text-zinc-500"}`}>
            <Icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────
function TopBar({ title, showBack, onBack }: { title: string; showBack?: boolean; onBack?: () => void }) {
  const [time, setTime] = useState(formatTime());
  useEffect(() => {
    const t = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 px-4 h-14 flex items-center gap-3">
      {showBack ? (
        <button onClick={onBack} className="p-1 -ml-1 text-zinc-400 hover:text-white"><ArrowLeft size={18} /></button>
      ) : (
        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
          <Shield size={14} className="text-black" strokeWidth={2.5} />
        </div>
      )}
      <span className="font-bold text-sm text-white truncate">{title}</span>
      <div className="ml-auto shrink-0">
        <span className="text-[11px] font-mono text-zinc-500 tabular-nums">{time}</span>
      </div>
    </header>
  );
}

// ─── Setup Screen ────────────────────────────────────────────────────────────
function SetupScreen({ onSetup }: { onSetup: () => void }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSetup = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/zo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "ping", apiKey: input.trim() }),
      });
      if (res.ok) { localStorage.setItem("niamos_setup", "1"); onSetup(); }
      else setError("Invalid token. Try again.");
    } catch { setError("Connection failed. Is Zo running?"); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-xl shadow-white/10">
        <Shield size={28} className="text-black" strokeWidth={2.5} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">NiamOS</h1>
      <p className="text-zinc-500 text-sm mb-8 text-center">Personal AI Command Interface</p>
      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Zo API Token</label>
          <input type="password" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSetup()}
            placeholder="Paste your token..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors" />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button onClick={handleSetup} disabled={loading || !input.trim()}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Connecting..." : "Connect"}
        </button>
        <p className="text-[10px] text-zinc-700 text-center">Settings → Advanced → Access Tokens → Create token</p>
      </div>
    </div>
  );
}

