import { useState, useEffect, useRef } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { API } from "../lib/api";

export function Capture() {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const save = async () => {
    const content = input.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      await API.capture(content);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      toast.success("Saved to inbox", { duration: 2500 });
      textareaRef.current?.focus();
    } catch {
      toast.error("Failed to save — check connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <div className="flex items-center gap-2 mb-5">
        <Zap size={15} style={{ color: "var(--accent)" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Capture
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        placeholder={"What's on your mind?\n\n⌘ + Enter to save."}
        className="flex-1 w-full rounded-2xl px-4 py-4 text-sm outline-none resize-none no-scrollbar transition-all"
        style={{
          background: "var(--surface)",
          border: `1px solid ${input ? "var(--border-s)" : "var(--border)"}`,
          color: "var(--text-1)",
        }}
      />

      <button
        onClick={save}
        disabled={!input.trim() || saving}
        className="mt-3 w-full font-bold py-3 rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-30"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {saving ? "Saving..." : "Save to Inbox"}
      </button>

      <p className="text-center mt-3 text-[10px]" style={{ color: "var(--text-3)" }}>
        Saves to MEMORY/inbox/today.md · ⌘+Enter
      </p>
    </div>
  );
}
