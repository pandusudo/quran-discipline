import { LuMoon } from "react-icons/lu";

interface ToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ isEnabled, onToggle, disabled = false }: ToggleProps) => {
  return (
    <button
      role="switch"
      aria-checked={isEnabled}
      disabled={disabled}
      onClick={() => !disabled && onToggle(!isEnabled)}
      className={`relative inline-flex items-center w-20 h-10 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950 ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${
        isEnabled
          ? "bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.45)]"
          : "bg-slate-700/80"
      }`}
    >
      <span className="sr-only">
        {isEnabled ? "Disable blocking" : "Enable blocking"}
      </span>

      {/* ON label */}
      <span
        className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-950 text-[10px] font-bold tracking-wide transition-opacity duration-200 select-none ${
          isEnabled ? "opacity-70" : "opacity-0"
        }`}
      >
        ON
      </span>

      {/* OFF label */}
      <span
        className={`absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold tracking-wide transition-opacity duration-200 select-none ${
          !isEnabled ? "opacity-70" : "opacity-0"
        }`}
      >
        OFF
      </span>

      <span
        className={`relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300 ${
          isEnabled ? "translate-x-11 bg-white" : "translate-x-1 bg-slate-500"
        }`}
      >
        <LuMoon
          className={`w-4 h-4 transition-colors duration-300 ${
            isEnabled ? "text-emerald-600" : "text-slate-300"
          }`}
        />
      </span>
    </button>
  );
};

export default Toggle;
