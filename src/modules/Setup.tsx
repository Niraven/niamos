import { useState, useEffect, useRef } from "react";
import { Shield } from "lucide-react";

export function Setup({ onSetup }: { onSetup: () => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleConnect = async () => {
    if (!key.trim()) { setError("Paste your API key first"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/agents");
      if (res.ok) onSetup();
      else setError("Connection failed.");
    } catch { setError("Cannot reach NiamOS."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-s)" }}>
            <Shield className="w-8 h-8" style={{ color: "var(--text-1)" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>NiamOS</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Personal AI Command Interface</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-3)" }}>
              API Key
            </label>
            <input
              ref={inputRef}
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleConnect()}
              placeholder="Settings > Advanced > Access Tokens"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: "var(--surface)",
                border: `1px solid ${error ? "var(--err)" : "var(--border-s)"}`,
                color: "var(--text-1)",
              }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: "var(--err)" }}>{error}</p>}
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "var(--text-1)", color: "var(--bg)" }}
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>

        <p className="text-center text-[11px]" style={{ color: "var(--text-3)" }}>
          Key stored locally, never sent to third parties.
        </p>
      </div>
    </div>
  );
}
