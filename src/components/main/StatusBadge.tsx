interface StatusBadgeProps {
  isEnabled: boolean;
  isFocusActive: boolean;
}

const StatusBadge = ({ isEnabled, isFocusActive }: StatusBadgeProps) => (
  <div
    className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 ${
      isFocusActive
        ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
        : isEnabled
          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
          : "bg-slate-800/50 border-slate-700/40 text-slate-400"
    }`}
  >
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${
        isFocusActive
          ? "bg-amber-400 animate-pulse"
          : isEnabled
            ? "bg-emerald-400 animate-pulse"
            : "bg-slate-500"
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
