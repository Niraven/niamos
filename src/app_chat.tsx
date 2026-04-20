
// ─── Chat Module ──────────────────────────────────────────────────────────────
const PERSONAS = [
  { id: "53947de5-d359-401f-876a-34e892cd5f36", name: "Technical Co-Founder", short: "CTO" },
  { id: "cbbd82ce", name: "Systems Copilot", short: "Sys" },
  { id: "38cd6522", name: "GTM Strategist", short: "GTM" },
  { id: "2f577e38", name: "Developer", short: "Dev" },
  { id: "b7c2c79a", name: "Researcher", short: "Res" },
  { id: "d3f85d30", name: "Operator", short: "Ops" },
];

function ChatModule() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePersona, setActivePersona] = useState(PERSONAS[0]);
  const [showPersonas, setShowPersonas] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: genId(), role: "user", content: input.trim(), time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input; setInput("");
    setLoading(true);
    try {
      const text = await API.chat(userInput, activePersona.id);
      setMessages(prev => [...prev, { id: genId(), role: "agent", content: text, time: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, { id: genId(), role: "agent", content: "Connection failed. Make sure Zo is running.", time: new Date().toISOString() }]);
    } finally { setLoading(false); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 1500);
  };

  const renderMarkdown = (text: string) => {
    try { return { __html: marked.parse(text) as string }; }
    catch { return { __html: text }; }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Persona bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-950/80">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <button onClick={() => setShowPersonas(p => !p)}
          className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
          {activePersona.name}
        </button>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono">Zo</span>
      </div>

      {/* Persona picker */}
      {showPersonas && (
        <div className="border-b border-zinc-800 bg-zinc-900 p-3 space-y-1">
          {PERSONAS.map(p => (
            <button key={p.id} onClick={() => { setActivePersona(p); setShowPersonas(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activePersona.id === p.id ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <Bot size={32} className="mb-3 text-zinc-600" />
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Start a conversation</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200"}`}>
              {m.role === "agent" ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <style>{`.prose pre { background: #18181b; padding: 12px; border-radius: 8px; overflow-x: auto; } .prose code { color: #e4e4e7; } .prose p { margin: 0; } .prose p + p { margin-top: 8px; } .prose strong { color: #fff; }`}</style>
                  <div dangerouslySetInnerHTML={renderMarkdown(m.content)} />
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              )}
              <div className="flex items-center justify-between mt-2 gap-4">
                <span className="text-[9px] opacity-50 font-mono">{relativeTime(m.time)}</span>
                {m.role === "agent" && (
                  <button onClick={() => copy(m.content, m.id)}
                    className="text-[9px] opacity-50 hover:opacity-100 transition-opacity">
                    {copied === m.id ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1"><div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:"0.15s"}} /><div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:"0.3s"}} /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950">
        <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Zo anything..." rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none resize-none max-h-32" />
          <button onClick={send} disabled={!input.trim() || loading}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 text-white rounded-xl transition-colors shrink-0">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

