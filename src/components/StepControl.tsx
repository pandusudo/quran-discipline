interface StepControlProps {
  label: string;
  value: number;
  unit: string;
  onDecrement: () => void;
  onIncrement: () => void;
}

export const StepControl = ({
  label,
  value,
  unit,
  onDecrement,
  onIncrement,
}: StepControlProps) => (
  <div className="flex flex-col items-center gap-2">
    <span className="text-emerald-600 text-[10px] font-semibold uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center gap-1.5">
      <button
        onClick={onDecrement}
        className="w-7 h-7 rounded-full border border-emerald-800/60 text-emerald-500 hover:text-amber-400 hover:border-amber-400/30 flex items-center justify-center text-base leading-none transition-all duration-150 active:scale-90"
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <div className="w-12 text-center">
        <span className="text-white font-bold text-lg tabular-nums">
          {value}
        </span>
        <span className="text-emerald-600 text-[10px] ml-0.5">{unit}</span>
      </div>
      <button
        onClick={onIncrement}
        className="w-7 h-7 rounded-full border border-emerald-800/60 text-emerald-500 hover:text-amber-400 hover:border-amber-400/30 flex items-center justify-center text-base leading-none transition-all duration-150 active:scale-90"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  </div>
);
