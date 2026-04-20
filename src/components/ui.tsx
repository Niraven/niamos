export function StatusDot({ status, pulse }: { status: "green" | "yellow" | "red" | "gray"; pulse?: boolean }) {
  const cls: Record<string, string> = {
    green:  "dot-green",
    yellow: "dot-yellow",
    red:    "dot-red",
    gray:   "dot-gray",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${cls[status]} ${pulse ? "animate-pulse" : ""}`} />
  );
}

export function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest px-4 py-2" style={{ color: "var(--text-3)" }}>
      {label}
    </h3>
  );
}

export function Card({ children, className = "", onClick }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-4 transition-all duration-200 ${onClick ? "cursor-pointer active:opacity-70" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Divider() {
  return <div className="h-px mx-4" style={{ background: "var(--border)" }} />;
}
