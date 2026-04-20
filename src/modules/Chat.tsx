import { useState, useEffect, useRef, useCallback } from "react";
import { Bot, Send, Plus, MessageSquare, ChevronLeft, X } from "lucide-react";
import { API } from "../lib/api";
import type { Message } from "../lib/api";
import { StatusDot } from "../components/ui";
import { renderMarkdown } from "../lib/markdown";
import { storage } from "../lib/storage";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  personaId: string;
  updatedAt: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PERSONAS = [
  { id: "53947de5-d359-401f-876a-34e892cd5f36", name: "Technical Co-Founder", short: "CTO" },
  { id: "cbbd82ce",                              name: "Systems Copilot",       short: "Sys" },
  { id: "38cd6522",                              name: "GTM Strategist",        short: "GTM" },
  { id: "2f577e38",                              name: "Developer",             short: "Dev" },
  { id: "b7c2c79a",                              name: "Researcher",            short: "Res" },
  { id: "d3f85d30",                              name: "Operator",              short: "Op"  },
];

const MAX_CONVS = 20;
const STORAGE_KEY = "conversations";

// ── Helpers ──────────────────────────────────────────────────────────────────

function newConv(personaId: string): Conversation {
  return {
    id: `conv_${Date.now()}`,
    name: "New conversation",
    messages: [],
    personaId,
    updatedAt: Date.now(),
  };
}

function saveConvs(convs: Conversation[]) {
  const sorted = [...convs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVS);
  storage.set(STORAGE_KEY, sorted);
  return sorted;
}

function loadConvs(): Conversation[] {
  return storage.get<Conversation[]>(STORAGE_KEY, []);
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function Chat() {
  const [convs, setConvs] = useState<Conversation[]>(() => {
    const saved = loadConvs();
    if (saved.length === 0) {
      const c = newConv(PERSONAS[0].id);
      storage.set(STORAGE_KEY, [c]);
      return [c];
    }
    return saved;
  });
  const [activeId, setActiveId] = useState<string>(() => loadConvs()[0]?.id || "");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPersona, setShowPersona] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = convs.find(c => c.id === activeId) ?? convs[0];
  const persona = PERSONAS.find(p => p.id === activeConv?.personaId) ?? PERSONAS[0];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeConv?.messages, loading]);

  const updateConv = useCallback((id: string, patch: Partial<Conversation>) => {
    setConvs(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c);
      return saveConvs(updated);
    });
  }, []);

  const switchConv = (id: string) => {
    setActiveId(id);
    setShowSidebar(false);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const createConv = () => {
    const c = newConv(persona.id);
    setConvs(prev => saveConvs([c, ...prev]));
    setActiveId(c.id);
    setShowSidebar(false);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConvs(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const c = newConv(persona.id);
        storage.set(STORAGE_KEY, [c]);
        setActiveId(c.id);
        return [c];
      }
      storage.set(STORAGE_KEY, filtered);
      if (id === activeId) setActiveId(filtered[0].id);
      return filtered;
    });
  };

  const setPersonaForConv = (personaId: string) => {
    updateConv(activeId, { personaId });
    setShowPersona(false);
  };

  const send = async () => {
    if (!input.trim() || loading || !activeConv) return;
    const userMsg = input.trim();
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Build optimistic message list with user message
    const messages: Message[] = [...activeConv.messages, { role: "user", content: userMsg }];
    const name = activeConv.messages.length === 0 ? userMsg.slice(0, 40) : activeConv.name;

    // Optimistic update — show user message immediately
    updateConv(activeId, { messages, name });
    setLoading(true);

    try {
      // Pass conversation_id so Zo continues the same thread
      const res = await API.sendChat(userMsg, persona.id, activeConv.id);
      const next: Message[] = [...messages, { role: "agent", content: res.output }];
      updateConv(activeId, { messages: next });
    } catch (err: any) {
      // Show error in chat as agent message, then remove after 4s
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(errMsg, { duration: 4000 });
      const next: Message[] = [...messages, { role: "agent", content: `⚠️ ${errMsg}` }];
      updateConv(activeId, { messages: next });
      // Remove error messages after 5 seconds
      const errTag = "⚠️";
      setTimeout(() => {
        setConvs(prev => {
          const updated = prev.map(c => {
            if (c.id !== activeId) return c;
            const msgs = c.messages.filter(m => m.role === "user" || !m.content.includes(errTag));
            return { ...c, messages: msgs };
          });
          return saveConvs(updated);
        });
      }, 5000);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full relative">

      {/* Sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <div className="relative w-72 h-full flex flex-col z-10"
            style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-3 safe-top"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Chats
              </span>
              <button onClick={() => setShowSidebar(false)} className="p-1">
                <ChevronLeft size={16} style={{ color: "var(--text-3)" }} />
              </button>
            </div>

            <button onClick={createConv}
              className="flex items-center gap-3 px-4 py-3 transition-all active:opacity-60"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <Plus size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>New conversation</span>
            </button>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {convs.map(c => {
                const p = PERSONAS.find(p => p.id === c.personaId) ?? PERSONAS[0];
                return (
                  <button key={c.id} onClick={() => switchConv(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:opacity-60 group"
                    style={{
                      background: c.id === activeId ? "rgba(59,130,246,0.08)" : "transparent",
                      borderBottom: "1px solid var(--border)",
                    }}>
                    <MessageSquare size={13} style={{ color: c.id === activeId ? "var(--accent)" : "var(--text-3)" }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate font-medium" style={{ color: c.id === activeId ? "var(--text-1)" : "var(--text-2)" }}>
                        {c.name}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                        {p.short} · {c.messages.length} msgs
                      </p>
                    </div>
                    <X size={12} style={{ color: "var(--text-3)" }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                      onClick={(e) => deleteConv(c.id, e)} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subheader */}
      <div className="px-4 py-2.5 flex items-center justify-between shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setShowPersona(p => !p)} className="flex items-center gap-2 active:opacity-60">
          <StatusDot status="green" pulse />
          <span className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{persona.name}</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>
            {activeConv?.messages.length ?? 0} msgs
          </span>
          <button onClick={() => setShowSidebar(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg active:opacity-60 transition-all"
            style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>
            <MessageSquare size={12} />
            <span className="text-[10px] font-bold">{convs.length}</span>
          </button>
        </div>
      </div>

      {/* Persona picker */}
      {showPersona && (
        <div className="shrink-0 p-3 space-y-1" style={{ borderBottom: "1px solid var(--border)" }}>
          {PERSONAS.map(p => (
            <button key={p.id} onClick={() => setPersonaForConv(p.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all active:opacity-60"
              style={{
                background: persona.id === p.id ? "rgba(59,130,246,0.08)" : "transparent",
                border: persona.id === p.id ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
              }}>
              <StatusDot status={persona.id === p.id ? "green" : "gray"} />
              <p className="text-xs font-bold" style={{ color: persona.id === p.id ? "var(--accent)" : "var(--text-1)" }}>
                {p.name}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {(activeConv?.messages.length ?? 0) === 0 && (
          <div className="h-full flex flex-col items-center justify-center" style={{ opacity: 0.15 }}>
            <Bot size={40} className="mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Ready to connect</p>
          </div>
        )}
        {activeConv?.messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              m.role === "user" ? "text-white" : ""
            }`}
              style={m.role === "user"
                ? { background: "var(--accent)" }
                : { background: "var(--surface-2)", border: "1px solid var(--border-s)" }
              }>
              <div className="text-xs leading-relaxed markdown"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-s)" }}>
              {[0, 150, 300].map(delay => (
                <span key={delay}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: "var(--text-3)", animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input — always visible above nav */}
      <div className="p-3 shrink-0 safe-bottom" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-s)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message Zo..."
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none max-h-32 no-scrollbar"
            style={{ color: "var(--text-1)" }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
            style={{ background: "var(--accent)" }}>
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-center mt-1.5 text-[10px]" style={{ color: "var(--text-3)" }}>
          Enter to send · Shift+Enter for newline · {convs.length}/{MAX_CONVS} chats
        </p>
      </div>
    </div>
  );
}
