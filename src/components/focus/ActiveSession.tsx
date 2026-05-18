import { LuExternalLink, LuTimer } from "react-icons/lu";
import { GeometricDivider } from "../GeometricDivider";
import { formatMs } from "../../helpers/time";
import { BLOCK_REDIRECT_URL } from "../../helpers/config";
import type { FocusSession } from "../../storage";

interface ActiveSessionProps {
  session: FocusSession;
  timeLeft: number;
  isFocus: boolean;
  onStop: () => void;
}

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const openWebsite = () => {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.create({ url: BLOCK_REDIRECT_URL });
  } else {
    window.open(BLOCK_REDIRECT_URL, "_blank");
  }
};

export const ActiveSession = ({
  session,
  timeLeft,
  isFocus,
  onStop,
}: ActiveSessionProps) => {
  const phaseDurationMs = isFocus
    ? session.focusDuration * 60 * 1000
    : session.restDuration * 60 * 1000;
  const progressFraction = timeLeft / phaseDurationMs;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progressFraction);

  return (
    <div className="bg-emerald-950 min-h-120 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
          <LuTimer className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight tracking-wide">
            Focus Session
          </h1>
          <p className="text-emerald-600 text-[11px] tracking-widest uppercase">
            {isFocus ? "Stay committed" : "Rest & recharge"}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-emerald-500 text-xs font-medium">
            Cycle {session.currentCycle}/{session.totalCycles}
          </p>
        </div>
      </div>

      <GeometricDivider />

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-4">
        {/* Phase badge */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold tracking-wider uppercase transition-all duration-500 ${
            isFocus
              ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
              : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${
              isFocus ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          {isFocus ? "Focus" : "Rest"}
        </div>

        {/* SVG ring timer */}
        <div className="relative">
          <svg width="136" height="136" className="-rotate-90">
            <circle
              cx="68"
              cy="68"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(6,78,59,0.4)"
              strokeWidth="6"
            />
            <circle
              cx="68"
              cy="68"
              r={RING_RADIUS}
              fill="none"
              stroke={isFocus ? "rgb(251,191,36)" : "rgb(52,211,153)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white font-bold text-3xl tabular-nums tracking-tight">
              {formatMs(timeLeft)}
            </span>
            <span className="text-emerald-700 text-[10px] uppercase tracking-widest mt-0.5">
              remaining
            </span>
          </div>
        </div>

        {/* Cycle dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: session.totalCycles }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < session.currentCycle - 1
                  ? "bg-emerald-600"
                  : i === session.currentCycle - 1
                    ? isFocus
                      ? "bg-amber-400 scale-125"
                      : "bg-emerald-400 scale-125"
                    : "bg-emerald-900 border border-emerald-800"
              }`}
            />
          ))}
        </div>

        {/* Status info */}
        <div className="w-full bg-emerald-900/20 rounded-xl border border-emerald-800/30 px-4 py-3 text-center">
          <p className="text-emerald-600 text-xs leading-relaxed">
            {isFocus
              ? "🛡️ Blocked sites are locked during focus"
              : "☕ Blocked sites are accessible during rest"}
          </p>
        </div>

        <button
          onClick={onStop}
          className="w-full py-2.5 rounded-xl border border-red-500/25 text-red-400/70 hover:text-red-400 hover:border-red-400/40 hover:bg-red-400/5 text-sm font-medium tracking-wide transition-all duration-200 active:scale-95"
        >
          Stop Session
        </button>

        <button
          onClick={openWebsite}
          className="inline-flex items-center gap-1 text-emerald-800 hover:text-amber-400/70 text-[10px] transition-colors duration-200"
        >
          <LuExternalLink className="w-2.5 h-2.5" />
          Visit Website
        </button>
      </div>
    </div>
  );
};
