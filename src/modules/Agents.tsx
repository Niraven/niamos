import { useState, useEffect } from "react";
import { API } from "../lib/api";
import type { Agent } from "../lib/api";
import { StatusDot, SectionHeader, Card, Skeleton } from "../components/ui";

export function Agents() {
  const [data, setData] = useState<{ scheduled: Agent[]; heartbeat: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { API.getAgents().then(d => { setData(d); setLoading(false); }); }, []);

  if (loading) return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  );

  const agents = data?.scheduled || [];
  const h = data?.heartbeat;

  return (
    <div className="pb-24">
      <SectionHeader label="Heartbeat" />
      <div className="px-4 mb-4">
        <Card className="flex items-center gap-3">
          <StatusDot status={h?.status === "active" ? "green" : "gray"} pulse={h?.status === "active"} />
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>
              {h?.status === "active" ? "Active" : "Inactive"}
            </p>
            <p className="text-[10px] font-mono truncate" style={{ color: "var(--text-3)" }}>
              {h?.lastCycle || "—"}
            </p>
          </div>
        </Card>
      </div>

      <SectionHeader label="Scheduled Agents" />
      <div className="px-4 space-y-0.5">
        {agents.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: "var(--text-3)" }}>
            No scheduled agents found.
          </p>
        )}
        {agents.map((a, i) => (
          <div key={i}
            className="flex items-center gap-3 py-3 px-3 rounded-xl transition-all"
            style={{ minHeight: 44 }}>
            <StatusDot
              status={a.status === "done" ? "green" : a.status === "next" ? "yellow" : "gray"}
              pulse={a.status === "next"}
            />
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{a.name}</p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{a.lastRun || "Not run yet"}</p>
            </div>
            <span className="text-[11px] font-mono" style={{ color: "var(--text-3)" }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
