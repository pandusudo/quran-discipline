interface StatusBadgeProps {
  isEnabled: boolean;
  isFocusActive: boolean;
}

const StatusBadge = ({ isEnabled, isFocusActive }: StatusBadgeProps) => (
  <div
    className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
      isFocusActive
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : isEnabled
          ? "bg-primary/10 border-border text-accent-foreground"
          : "bg-muted border-border text-muted-foreground"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        isFocusActive
          ? "bg-amber-400 animate-pulse"
          : isEnabled
            ? "bg-primary animate-pulse"
            : "bg-muted-foreground/40"
      }`}
    />
    {isFocusActive
      ? "Focus Session Active"
      : isEnabled
        ? "Protection Active"
        : "Protection Paused"}
  </div>
);

export default StatusBadge;
