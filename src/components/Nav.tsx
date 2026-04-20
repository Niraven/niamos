import {
  Home,
  MessageSquare,
  Zap,
  Cpu,
  Brain,
  FolderOpen,
} from "lucide-react";
import type { Tab } from "../lib/api";

export const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "home",    icon: <Home          size={20} />, label: "Home"    },
  { id: "chat",    icon: <MessageSquare size={20} />, label: "Chat"    },
  { id: "capture", icon: <Zap           size={20} />, label: "Capture" },
  { id: "agents",  icon: <Cpu          size={20} />, label: "Agents"  },
  { id: "memory",  icon: <Brain        size={20} />, label: "Memory"  },
  { id: "files",   icon: <FolderOpen   size={20} />, label: "Files"   },
];

export const NAV_CLEARANCE = 80;

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed left-1/2 z-50 flex items-center"
      style={{
        transform: "translateX(-50%)",
        bottom: "max(20px, calc(env(safe-area-inset-bottom) + 16px))",
        // Floating pill: frosted glass + subtle border
        background: "rgba(12, 12, 14, 0.88)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "28px",
        padding: "6px 10px",
        gap: "2px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className="relative flex items-center justify-center transition-all duration-200"
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "20px",
              background: isActive
                ? "rgba(59, 130, 246, 0.14)"
                : "transparent",
              color: isActive ? "#3b82f6" : "#52525b",
              // Active: subtle glow behind icon
              boxShadow: isActive
                ? "0 0 16px rgba(59, 130, 246, 0.25), 0 0 4px rgba(59, 130, 246, 0.2)"
                : "none",
            }}
          >
            {/* Icon */}
            <span style={{ transform: isActive ? "scale(1.08)" : "scale(1)", transition: "transform 0.15s ease" }}>
              {tab.icon}
            </span>

            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute"
                style={{
                  bottom: "5px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                  boxShadow: "0 0 6px rgba(59, 130, 246, 0.8)",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
