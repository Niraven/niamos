import { useState, useEffect } from "react";
import { Bot, Brain, Files, Zap, ChevronRight, WifiOff } from "lucide-react";
import { API } from "../lib/api";
import type { Agent, MemoryFile, CalendarEvent, Tab } from "../lib/api";
import { StatusDot, SectionHeader, Card, Skeleton } from "../components/ui";

export function Home({ setTab }: { setTab: (t: Tab) => void }) {
  const [agents, setAgents] = useState<{ scheduled: Agent[] } | null>(null);
  const [memory, setMemory] = useState<MemoryFile[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onO = () => setOnline(true);
    const onF = () => setOnline(false);
    window.addEventListener("online", onO);
    window.addEventListener("offline", onF);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", onO);
      window.removeEventListener("offline", onF);
    };
  }, []);

  useEffect(() => {
    Promise.all([API.getAgents(), API.getMemory()]).then(([ag, mem]) => {
      setAgents(ag);
      // Memory API returns { working, shared, journal, strategic }
      // Flatten and deduplicate
      const all: MemoryFile[] = [
        ...(mem.working || []),
        ...(mem.shared || []),
        ...(mem.journal || []),
        ...(mem.strategic || []),
      ];
      const seen = new Set<string>();
      const unique = all.filter((f: MemoryFile) => {
        if (seen.has(f.path)) return false;
        seen.add(f.path);
        return true;
      }).slice(0, 5);
      setMemory(unique);
    });
    API.getCalendar().then(cal => {
      setCalendar(Array.isArray(cal) ? cal.slice(0, 3) : []);
    }).finally(() => setLoading(false));
  }, []);

  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const nextAgent = agents?.scheduled?.find((a: Agent) => a.status === "next");

  return (
    <div className="pb-28 space-y-0">

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
            {greeting}, Niam.
          </h1>
          {!online && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ color: "var(--warn)", background: "rgba(255,204,0,0.1)" }}>
              <WifiOff size={10} /> Offline
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>Your system is running.</p>
      </div>

      {/* Agent tiles */}
      <SectionHeader label="Active Agents" />
      <div className="px-4 mb-4">
        {loading ? (
          <div className="flex gap-3"><Skeleton className="h-[72px] flex-1" /><Skeleton className="h-[72px] flex-1" /></div>
        ) : (
          <div className="flex gap-3">
            <Card className="flex-1 flex items-center gap-3" onClick={() => setTab("agents")}>
              <StatusDot status="green" pulse />
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>Zo</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Active</p>
              </div>
            </Card>
            <Card className="flex-1 flex items-center gap-3" onClick={() => setTab("agents")}>
              <StatusDot status="gray" />
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>Hermes</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Desktop</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Next agent */}
      {nextAgent && (
        <>
          <SectionHeader label="Up Next" />
          <div className="px-4 mb-4">
            <Card className="flex items-center justify-between" onClick={() => setTab("agents")}>
              <div className="flex items-center gap-3">
                <StatusDot status="yellow" pulse />
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{nextAgent.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>in {nextAgent.time}</p>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: "var(--text-3)" }} />
            </Card>
          </div>
        </>
      )}

      {/* Schedule */}
      {agents?.scheduled?.length ? (
        <>
          <SectionHeader label="Today's Schedule" />
          <div className="px-4 mb-4 space-y-0.5">
            {agents.scheduled.slice(0, 6).map((a: Agent, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors"
                style={{ minHeight: 44 }}>
                <StatusDot status={a.status === "done" ? "green" : a.status === "next" ? "yellow" : "gray"} />
                <span className="text-xs font-medium flex-1" style={{ color: "var(--text-2)" }}>{a.name}</span>
                <span className="text-[11px] font-mono" style={{ color: "var(--text-3)" }}>{a.time}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Calendar */}
      {calendar.length ? (
        <>
          <SectionHeader label="Calendar" />
          <div className="px-4 mb-4 space-y-2">
            {calendar.map(ev => (
              <Card key={ev.id} className="flex items-center gap-3">
                <div className="text-center pr-3" style={{ borderRight: "1px solid var(--border-s)" }}>
                  <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
                    {new Date(ev.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="text-xs font-medium flex-1 truncate" style={{ color: "var(--text-1)" }}>{ev.title}</p>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {/* Recent memory */}
      {memory.length ? (
        <>
          <SectionHeader label="Recent Memory" />
          <div className="px-4 mb-4 space-y-0.5">
            {memory.map((f, i) => (
              <button key={i} onClick={() => setTab("memory")}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all active:opacity-60"
                style={{ minHeight: 44 }}>
                <Brain size={13} style={{ color: "var(--text-3)" }} className="shrink-0" />
                <span className="text-xs font-mono flex-1 text-left truncate" style={{ color: "var(--text-2)" }}>{f.name}</span>
                <ChevronRight size={12} style={{ color: "var(--text-3)" }} />
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* Quick actions */}
      <SectionHeader label="Quick Actions" />
      <div className="px-4 pb-6 grid grid-cols-2 gap-2">
        {[
          { icon: <Bot size={16} />,   label: "Chat",    tab: "chat"    as Tab },
          { icon: <Zap size={16} />,   label: "Capture", tab: "capture" as Tab },
          { icon: <Brain size={16} />, label: "Memory",  tab: "memory"  as Tab },
          { icon: <Files size={16} />, label: "Files",   tab: "files"   as Tab },
        ].map((a, i) => (
          <button key={i} onClick={() => setTab(a.tab)}
            className="glass-card p-4 flex items-center gap-3 transition-all active:opacity-60">
            <span style={{ color: "var(--text-3)" }}>{a.icon}</span>
            <span className="text-xs font-bold" style={{ color: "var(--text-2)" }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
