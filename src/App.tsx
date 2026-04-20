import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked"; marked.setOptions({ async: false, gfm: true, breaks: true });
import {
  Home, Bot, Brain, Files, Cpu, Zap, ChevronRight,
  Send, Shield, ArrowLeft, WifiOff
} from "lucide-react";

// Types
type Tab = "home" | "chat" | "agents" | "memory" | "files";
interface Message { role: "user" | "agent"; content: string; }
interface Agent { name: string; time: string; status: "done" | "next" | "upcoming"; lastRun?: string; }
interface MemoryFile { name: string; path: string; mtime: string; }
interface CalendarEvent { id: string; title: string; start: string; }
interface FileEntry { name: string; isDir: boolean; size: number; }

// API Layer
const API = {
  getAgents: () => fetch(`/api/agents`).then(r => r.json()).catch(() => ({ scheduled: [], heartbeat: {} })),
  getMemory: () => fetch(`/api/memory`).then(r => r.json()).catch(() => ({ files: [] })),
  getCalendar: () => fetch(`/api/calendar`).then(r => r.json()).catch(() => []),
  getFiles: (p?: string) => fetch(p ? `/api/files/${encodeURIComponent(p)}` : "/api/files").then(r => r.json()).catch(() => []),
  sendChat: (input: string, persona_id?: string) => fetch(`/api/zo`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, persona_id })
  }).then(async r => {
    if (!r.ok) throw new Error("API error");
    const data = await r.json();
    return { output: data.output || "No response", conversation_id: data.conversation_id };
  }),
  capture: (content: string) => fetch(`/api/capture`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }) }).then(r => r.json())
};
// Setup Screen
function SetupScreen({ onSetup }: { onSetup: () => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const handleConnect = async () => {
    if (!key.trim()) { setError("Paste your API key first"); return; }
    setLoading(true); setError("");
    try { const res = await fetch(`/api/agents`); if (res.ok) onSetup(); else setError("Connection failed."); }
    catch { setError("Cannot reach NiamOS."); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NiamOS</h1>
          <p className="text-zinc-400 text-sm">Personal AI Command Interface</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">API Key</label>
            <input ref={inputRef} type="password" value={key} onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleConnect()}
              placeholder="Settings > Advanced > Access Tokens"
              className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleConnect} disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-xl text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50">
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
        <p className="text-center text-zinc-600 text-xs">Key stored locally, never sent to third parties.</p>
      </div>
    </div>
  );
}
// Navigation
const TABS = [
  { id: "home" as Tab, icon: <Home size={20} />, label: "Home" },
  { id: "chat" as Tab, icon: <Bot size={20} />, label: "Chat" },
  { id: "agents" as Tab, icon: <Cpu size={20} />, label: "Agents" },
  { id: "memory" as Tab, icon: <Brain size={20} />, label: "Memory" },
  { id: "files" as Tab, icon: <Files size={20} />, label: "Files" },
];

function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#09090b]/90 backdrop-blur-xl border-t border-[#3f3f46] flex safe-bottom z-50">
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active === tab.id ? "text-blue-500" : "text-zinc-500"}`}>
          {tab.icon}
          <span className="text-[10px] font-bold uppercase">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 bg-[#09090b]/90 backdrop-blur-xl border-b border-[#3f3f46] z-40 safe-top">
      <div className="flex items-center h-12 px-4">
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center mr-2">
          <Shield className="w-4 h-4 text-black" />
        </div>
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
    </header>
  );
}

function StatusDot({ status, pulse }: { status: "green" | "yellow" | "red" | "gray"; pulse?: boolean }) {
  const colors: Record<string,string> = { green: "bg-emerald-500", yellow: "bg-amber-500", red: "bg-red-500", gray: "bg-zinc-600" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${pulse ? "animate-pulse" : ""}`} />;
}

function SectionHeader({ label }: { label: string }) {
  return <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-4 py-2">{label}</h3>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#18181b] border border-[#3f3f46]/50 rounded-xl p-4 ${className}`}>{children}</div>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}
// Configure marked
marked.setOptions({ breaks: true, gfm: true });
function renderMarkdown(text: string): string { return marked.parse(text, { async: false }) as string; }

function HomeDashboard({ setTab }: { setTab: (t: Tab) => void }) {
  const [agents, setAgents] = useState<{ scheduled: Agent[] } | null>(null);
  const [memory, setMemory] = useState<MemoryFile[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const onO = () => setOnline(true); const onF = () => setOnline(false);
    window.addEventListener("online", onO); window.addEventListener("offline", onF);
    setOnline(navigator.onLine);
    return () => { window.removeEventListener("online", onO); window.removeEventListener("offline", onF); };
  }, []);
  useEffect(() => { Promise.all([API.getAgents(), API.getMemory(), API.getCalendar()]).then(([ag, mem, cal]) => { setAgents(ag); setMemory(mem.files?.slice(0,5)||[]); setCalendar(Array.isArray(cal)?cal.slice(0,3):[]); setLoading(false); }); }, []);
  const h = new Date().getHours(); const greeting = h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const nextAgent = agents?.scheduled?.find(a => a.status === "next");
  return (
    <div className="space-y-1 pb-20">
      <div className="px-4 pt-4 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white">{greeting}, Niam.</h1>
          {!online && <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1"><WifiOff size={10}/> Offline</span>}
        </div>
        <p className="text-xs text-zinc-500">Your system is running.</p>
      </div>
      <SectionHeader label="Active Agents" />
      <div className="px-4 space-y-2">
        {loading ? <div className="flex gap-3"><Skeleton className="h-20 flex-1" /><Skeleton className="h-20 flex-1" /></div> : (
          <div className="flex gap-3">
            <Card className="flex-1 flex items-center gap-3 cursor-pointer hover:border-blue-500/30 transition-colors" onClick={() => setTab("agents")}>
              <StatusDot status="green" pulse />
              <div><p className="text-xs font-bold text-white">Zo</p><p className="text-[10px] text-zinc-500">Active</p></div>
            </Card>
            <Card className="flex-1 flex items-center gap-3 cursor-pointer hover:border-purple-500/30 transition-colors" onClick={() => setTab("agents")}>
              <StatusDot status="gray" />
              <div><p className="text-xs font-bold text-white">Hermes</p><p className="text-[10px] text-zinc-500">Desktop</p></div>
            </Card>
          </div>
        )}
      </div>
      {nextAgent && (<><SectionHeader label="Next Agent" /><div className="px-4"><Card className="flex items-center justify-between cursor-pointer" onClick={() => setTab("agents")}><div className="flex items-center gap-3"><StatusDot status="yellow" pulse /><div><p className="text-xs font-bold text-white">{nextAgent.name}</p><p className="text-[10px] text-zinc-500">in {nextAgent.time}</p></div></div><ChevronRight size={14} className="text-zinc-600"/></Card></div></>)}
      {agents?.scheduled?.length ? (<><SectionHeader label="Today's Schedule" /><div className="px-4 space-y-1">{agents.scheduled.slice(0,6).map((a,i) => <div key={i} className="flex items-center gap-3 py-2"><StatusDot status={a.status==="done"?"green":a.status==="next"?"yellow":"gray"}/><span className="text-xs font-medium text-zinc-300">{a.name}</span><span className="text-[10px] text-zinc-600 ml-auto font-mono">{a.time}</span></div>)}</div></>) : null}
      {calendar.length ? (<><SectionHeader label="Calendar" /><div className="px-4 space-y-2">{calendar.map(ev => <Card key={ev.id} className="flex items-center gap-3"><div className="text-center border-r border-[#3f3f46] pr-3"><p className="text-xs font-bold text-white">{new Date(ev.start).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</p></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-white truncate">{ev.title}</p></div></Card>)}</div></>) : null}
      {memory.length ? (<><SectionHeader label="Recent Memory" /><div className="px-4 space-y-1">{memory.map((f,i) => <button key={i} onClick={() => setTab("memory")} className="w-full flex items-center gap-3 py-2.5 hover:bg-[#18181b] rounded-lg px-2 transition-colors"><Brain size={12} className="text-zinc-500 shrink-0"/><span className="text-xs font-mono text-zinc-300 flex-1 text-left truncate">{f.name}</span><ChevronRight size={12} className="text-zinc-600"/></button>)}</div></>) : null}
      <SectionHeader label="Quick Actions" />
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {[{icon:<Bot size={16}/>,label:"Chat",tab:"chat"},{icon:<Files size={16}/>,label:"Files",tab:"files"},{icon:<Brain size={16}/>,label:"Memory",tab:"memory"},{icon:<Zap size={16}/>,label:"Capture",tab:"chat"}].map((a,i) => <button key={i} onClick={() => setTab(a.tab as Tab)} className="bg-[#18181b] border border-[#3f3f46]/50 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500/30 transition-colors"><span className="text-zinc-400">{a.icon}</span><span className="text-xs font-bold text-zinc-300">{a.label}</span></button>)}
      </div>
    </div>
  );
}
const PERSONAS = [
  { id: "53947de5-d359-401f-876a-34e892cd5f36", name: "Technical Co-Founder", short: "CTO" },
  { id: "cbbd82ce", name: "Systems Copilot", short: "Sys" },
  { id: "38cd6522", name: "GTM Strategist", short: "GTM" },
  { id: "2f577e38", name: "Developer", short: "Dev" },
  { id: "b7c2c79a", name: "Researcher", short: "Res" },
  { id: "d3f85d30", name: "Operator", short: "Op" },
];

function ChatModule() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [showPersona, setShowPersona] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { scrollRef.current && scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, loading]);
  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try { const res = await API.sendChat(userMsg, persona.id); setMessages(m => [...m, { role: "agent", content: res.output }]); }
    catch { setMessages(m => [...m, { role: "agent", content: "Error: Could not reach Zo." }]); }
    finally { setLoading(false); inputRef.current && inputRef.current.focus(); }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-[#3f3f46] flex items-center justify-between">
        <button onClick={() => setShowPersona(p => !p)} className="flex items-center gap-2">
          <StatusDot status="green" pulse />
          <span className="text-xs font-bold text-white">{persona.name}</span>
        </button>
        <span className="text-[10px] text-zinc-600 font-mono">{messages.length} msgs</span>
      </div>
      {showPersona && (<div className="border-b border-[#3f3f46] p-3 space-y-1">
        {PERSONAS.map(p => (<button key={p.id} onClick={() => { setPersona(p); setShowPersona(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${persona.id===p.id?"bg-blue-500/10 border border-blue-500/30":"hover:bg-[#18181b]"}`}>
            <StatusDot status={persona.id===p.id?"green":"gray"} />
            <div><p className={`text-xs font-bold ${persona.id===p.id?"text-blue-400":"text-white"}`}>{p.name}</p></div>
        </button>))}
      </div>)}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && (<div className="h-full flex flex-col items-center justify-center opacity-20"><Bot size={40} className="mb-3"/><p className="text-[10px] font-bold uppercase tracking-widest">Ready to connect</p></div>)}
        {messages.map((m, i) => (<div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role==="user"?"bg-blue-600 text-white":"bg-[#18181b] border border-[#3f3f46]"}`}>
            <div className="text-xs leading-relaxed markdown" dangerouslySetInnerHTML={{__html: renderMarkdown(m.content)}}/>
          </div></div>))}
        {loading && (<div className="flex justify-start"><div className="bg-[#18181b] border border-[#3f3f46] rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"/>
          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"/>
          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"/>
        </div></div>)}
      </div>
      <div className="p-3 border-t border-[#3f3f46] safe-bottom">
        <div className="flex items-end gap-2 bg-[#18181b] border border-[#3f3f46] rounded-2xl px-4 py-3">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message Zo..." rows={1} className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none resize-none max-h-32 no-scrollbar"
            style={{height:"auto"}}
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 128) + "px"; }}
          />
          <button onClick={send} disabled={!input.trim()||loading} className="shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-blue-400 transition-colors">
            <Send size={14} className="text-white"/>
          </button>
        </div>
      </div>
    </div>
  );
}
function AgentsModule() {
  const [data, setData] = useState<{ scheduled: Agent[]; heartbeat: any } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { API.getAgents().then(d => { setData(d); setLoading(false); }); }, []);
  if (loading) return (<div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full"/>)}</div>);
  const agents = data?.scheduled || [];
  const h = data?.heartbeat;
  return (
    <div className="space-y-1 pb-20">
      <SectionHeader label="Heartbeat" />
      <div className="px-4">
        <Card className="flex items-center gap-3">
          <StatusDot status={h?.status==="active"?"green":"gray"} pulse={h?.status==="active"}/>
          <div><p className="text-xs font-bold text-white">{h?.status==="active"?"Active":"Inactive"}</p><p className="text-[10px] text-zinc-500">{h?.lastCycle || "—"}</p></div>
        </Card>
      </div>
      <SectionHeader label="Scheduled Agents" />
      <div className="px-4 space-y-1">
        {agents.length === 0 && <p className="text-xs text-zinc-600 px-4 py-4 text-center">No scheduled agents found.</p>}
        {agents.map((a, i) => (<div key={i} className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-[#18181b] transition-colors">
          <StatusDot status={a.status==="done"?"green":a.status==="next"?"yellow":"gray"} pulse={a.status==="next"}/>
          <div className="flex-1"><p className="text-xs font-bold text-white">{a.name}</p><p className="text-[10px] text-zinc-500">{a.lastRun || "Not run yet"}</p></div>
          <span className="text-[10px] font-mono text-zinc-600">{a.time}</span>
        </div>))}
      </div>
    </div>
  );
}

function MemoryModule() {
  const [memory, setMemory] = useState<{ files: MemoryFile[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  useEffect(() => { API.getMemory().then(d => { const allFiles = [...(d.working||[]), ...(d.shared||[]), ...(d.journal||[]), ...(d.strategic||[])]; const seen = new Set(); const unique = allFiles.filter((f: any) => { if(seen.has(f.path)) return false; seen.add(f.path); return true; }).slice(0, 15); setMemory(unique); setLoading(false); }); }, []);
  const openFile = async (f: MemoryFile) => {
    setSelected(f); setLoadingContent(true);
    const rawPath = f.path.startsWith('MEMORY/') ? f.path : 'MEMORY/' + f.path; const text = await fetch(`/api/memory/${encodeURIComponent(rawPath)}`).then(r => r.text()).catch(() => 'Could not load file.');
    setContent(text); setLoadingContent(false);
  };
  if (selected) return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[#3f3f46] flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="p-1.5 text-zinc-400 hover:text-white"><ArrowLeft size={18}/></button>
        <span className="text-xs font-mono text-zinc-400 truncate">{selected.path}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loadingContent ? <Skeleton className="h-4 w-full mb-2"/> : (<div className="text-xs leading-relaxed markdown font-mono whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: renderMarkdown(content)}}/>)}
      </div>
    </div>
  );
  return (
    <div className="space-y-1 pb-20">
      <SectionHeader label="Memory Files" />
      <div className="px-4 space-y-1">
        {loading ? [1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full"/>) : (
          (memory?.files || []).map((f, i) => (<button key={i} onClick={() => openFile(f)} className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-[#18181b] transition-colors">
            <Brain size={12} className="text-zinc-500 shrink-0"/>
            <div className="flex-1 text-left min-w-0"><p className="text-xs font-mono text-zinc-300 truncate">{f.name}</p><p className="text-[10px] text-zinc-600 truncate">{f.path}</p></div>
            <ChevronRight size={12} className="text-zinc-600 shrink-0"/>
          </button>))
        )}
      </div>
    </div>
  );
}
function FilesModule() {
  const [path, setPath] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ name: string; content: string } | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const data = await API.getFiles(path || undefined);
    setFiles(data.sort ? data.sort((a: FileEntry, b: FileEntry) => { if(a.isDir && !b.isDir) return -1; if(!a.isDir && b.isDir) return 1; return a.name.localeCompare(b.name); }) : []);
    setLoading(false);
  }, [path]);
  useEffect(() => { load(); }, [load]);
  const navigate = (name: string, isDir: boolean) => { if(isDir) setPath(p => p ? p + "/" + name : name); };
  const navigateUp = () => setPath(p => { const i = p.lastIndexOf("/"); return i >= 0 ? p.slice(0, i) : ""; });
  const openFile = async (f: FileEntry) => {
    if (f.isDir) { navigate(f.name, true); return; }
    const p = path ? path + "/" + f.name : f.name;
    const text = await fetch(`/api/files/${encodeURIComponent(p)}`).then(r => r.text()).catch(() => "Could not load file.");
    setViewer({ name: f.name, content: text });
  };
  const formatSize = (bytes: number) => { if(!bytes) return "—"; const k = 1024; const s = ["B","KB","MB"]; const i = Math.floor(Math.log(bytes)/Math.log(k)); return parseFloat((bytes/Math.pow(k,i)).toFixed(1)) + s[i]; };
  const crumbs = path ? path.split("/") : [];
  if (viewer) return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[#3f3f46] flex items-center gap-3">
        <button onClick={() => setViewer(null)} className="p-1.5 text-zinc-400 hover:text-white"><ArrowLeft size={18}/></button>
        <span className="text-xs font-mono text-zinc-400 truncate">{viewer.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs leading-relaxed markdown font-mono whitespace-pre-wrap no-scrollbar overflow-x-auto" dangerouslySetInnerHTML={{__html: renderMarkdown(viewer.content.slice(0,10000))}}/>
      </div>
    </div>
  );
  return (
    <div className="space-y-1 pb-20">
      {crumbs.length > 0 && (<div className="px-4 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button onClick={() => setPath("")} className="text-xs text-zinc-500 hover:text-white shrink-0">Files</button>
        {crumbs.map((c, i) => (<span key={i} className="flex items-center gap-1 shrink-0">
          <ChevronRight size={10} className="text-zinc-600"/>
          <button onClick={() => setPath(crumbs.slice(0,i+1).join("/"))} className="text-xs text-zinc-500 hover:text-white">{c}</button>
        </span>))}
      </div>)}
      {crumbs.length > 0 && (<button onClick={navigateUp} className="px-4 py-2 flex items-center gap-2 text-xs text-zinc-500 hover:text-white w-full">
        <ArrowLeft size={12}/> Back
      </button>)}
      <SectionHeader label={path || "Workspace"} />
      <div className="px-4 space-y-0.5">
        {loading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full"/>) : (
          files.map((f, i) => (<button key={i} onClick={() => openFile(f)} className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-[#18181b] transition-colors">
            <Files size={12} className={`shrink-0 ${f.isDir?"text-blue-400":"text-zinc-500"}`}/>
            <span className={`flex-1 text-left text-xs ${f.isDir?"font-bold text-white":"text-zinc-400 font-mono"} truncate`}>{f.name}</span>
            <span className="text-[10px] text-zinc-600 shrink-0">{f.isDir ? "Folder" : formatSize(f.size)}</span>
          </button>))
        )}
      </div>
    </div>
  );
}
// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [setupDone, setSetupDone] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Check setup
    const saved = localStorage.getItem("niamos_setup_done");
    if (saved === "true") setSetupDone(true);
  }, []);

  const handleSetup = () => {
    localStorage.setItem("niamos_setup_done", "true");
    setSetupDone(true);
  };

  if (!setupDone) return <SetupScreen onSetup={handleSetup} />;

  return (
    <div className="flex flex-col h-screen bg-[#09090b] safe-top">
      <TopBar title={TABS.find(t => t.id === activeTab)?.label || "NiamOS"} />
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tab-content">
          {activeTab === "home" && <HomeDashboard setTab={setActiveTab} />}
          {activeTab === "chat" && <ChatModule />}
          {activeTab === "agents" && <AgentsModule />}
          {activeTab === "memory" && <MemoryModule />}
          {activeTab === "files" && <FilesModule />}
        </div>
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}