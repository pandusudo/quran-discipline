import { LuExternalLink, LuTimer } from "react-icons/lu";
import { GeometricDivider } from "../GeometricDivider";
import { StepControl } from "../StepControl";
import { BLOCK_REDIRECT_URL } from "../../helpers/config";

export interface SessionConfig {
  focusDuration: number;
  restDuration: number;
  cycles: number;
}

interface SessionConfigPanelProps {
  config: SessionConfig;
  showComplete: boolean;
  totalMinutes: number;
  onAdjust: (
    key: keyof SessionConfig,
    delta: number,
    min: number,
    max: number,
  ) => void;
  onStart: () => void;
}

const openWebsite = () => {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.create({ url: BLOCK_REDIRECT_URL });
  } else {
    window.open(BLOCK_REDIRECT_URL, "_blank");
  }
};

export const SessionConfigPanel = ({
  config,
  showComplete,
  totalMinutes,
  onAdjust,
  onStart,
}: SessionConfigPanelProps) => (
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
          Configure your session
        </p>
      </div>
    </div>

    <GeometricDivider />

    {/* Session complete banner */}
    {showComplete && (
      <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center">
        <p className="text-emerald-400 text-sm font-medium">
          🎉 Session complete — well done!
        </p>
      </div>
    )}

    {/* Step controls */}
    <div className="grid grid-cols-3 pt-5 pb-2">
      <div className="flex justify-center items-center relative">
        <StepControl
          label="Focus"
          value={config.focusDuration}
          unit="min"
          onDecrement={() => onAdjust("focusDuration", -5, 1, 120)}
          onIncrement={() => onAdjust("focusDuration", 5, 1, 120)}
        />
        <div className="absolute right-0 w-px h-10 bg-emerald-900/60" />
      </div>
      <div className="flex justify-center items-center relative">
        <StepControl
          label="Rest"
          value={config.restDuration}
          unit="min"
          onDecrement={() => onAdjust("restDuration", -1, 1, 60)}
          onIncrement={() => onAdjust("restDuration", 1, 1, 60)}
        />
        <div className="absolute right-0 w-px h-10 bg-emerald-900/60" />
      </div>
      <div className="flex justify-center items-center">
        <StepControl
          label="Cycles"
          value={config.cycles}
          unit="×"
          onDecrement={() => onAdjust("cycles", -1, 1, 10)}
          onIncrement={() => onAdjust("cycles", 1, 1, 10)}
        />
      </div>
    </div>

    <GeometricDivider />

    {/* Session preview */}
    <div className="px-5 pt-3 pb-2">
      <p className="text-emerald-700 text-[10px] font-semibold uppercase tracking-widest mb-3">
        Session Preview
      </p>
      <div className="flex items-center flex-wrap gap-1.5">
        {Array.from({ length: config.cycles }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-amber-400/8 border border-amber-400/20 rounded-lg px-2.5 py-1">
              <span className="text-amber-400/80 text-[10px] font-medium">
                Focus {config.focusDuration}m
              </span>
            </div>
            {i < config.cycles - 1 && (
              <>
                <div className="flex items-center gap-1 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                  <span className="text-emerald-500/80 text-[10px] font-medium">
                    Rest {config.restDuration}m
                  </span>
                </div>
                <span className="text-emerald-800 text-[10px]">→</span>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="text-emerald-800 text-[10px] mt-2.5">
        Total session:{" "}
        <span className="text-emerald-600">{totalMinutes} min</span>
      </p>
    </div>

    {/* Info */}
    <div className="mx-5 mt-2 px-4 py-2.5 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-center">
      <p className="text-emerald-600 text-xs leading-relaxed">
        🛡️ Blocked sites are inaccessible during focus periods
      </p>
    </div>

    {/* Actions */}
    <div className="flex-1 flex flex-col items-center justify-end px-5 pb-5 pt-3 gap-3">
      <button
        onClick={onStart}
        className="w-full py-3 rounded-xl bg-amber-500/90 hover:bg-amber-400 active:scale-95 text-emerald-950 font-bold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-amber-900/20"
      >
        Start Focus Session
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
