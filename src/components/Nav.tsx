import { Home, Bot, Zap, Cpu, Brain, Files } from "lucide-react";
import type { Tab } from "../lib/api";

export const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "home",    icon: <Home size={20} />,  label: "Home" },
  { id: "chat",    icon: <Bot size={20} />,   label: "Chat" },
  { id: "capture", icon: <Zap size={20} />,   label: "Capture" },
  { id: "agents",  icon: <Cpu size={20} />,   label: "Agents" },
  { id: "memory",  icon: <Brain size={20} />, label: "Memory" },
  { id: "files",   icon: <Files size={20} />, label: "Files" },
];

export const NAV_CLEARANCE = 88; // px — bottom padding for content

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed left-1/2 z-50 flex items-center gap-1 px-2 py-2 rounded-full"
      style={{
        transform: "translateX(-50%)",
        bottom: "max(20px, calc(env(safe-area-inset-bottom) + 12px))",
        background: "rgba(14,14,14,0.92)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid var(--border-s)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          aria-label={tab.label}
          className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90"
          style={{
            background: active === tab.id ? "rgba(59,130,246,0.15)" : "transparent",
            color: active === tab.id ? "var(--accent)" : "var(--text-3)",
          }}
        >
          {tab.icon}
          {active === tab.id && (
            <span
              className="absolute rounded-full"
              style={{
                bottom: 6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 4,
                height: 4,
                background: "var(--accent)",
              }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
