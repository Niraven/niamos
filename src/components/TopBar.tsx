import { Shield } from "lucide-react";

export function TopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 glass z-40 safe-top">
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{title}</span>
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  );
}
