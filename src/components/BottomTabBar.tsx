import { LuMoon, LuTimer, LuSettings } from "react-icons/lu";

export type Tab = "home" | "focus" | "settings";

interface BottomTabBarProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const TABS = [
  { id: "home" as Tab, label: "Home", Icon: LuMoon },
  { id: "focus" as Tab, label: "Focus", Icon: LuTimer },
  { id: "settings" as Tab, label: "Settings", Icon: LuSettings },
];

const BottomTabBar = ({ activeTab, onChange }: BottomTabBarProps) => (
  <div className="flex bg-emerald-950 border-t border-emerald-900/60">
    {TABS.map(({ id, label, Icon }) => {
      const isActive = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200 relative ${
            isActive
              ? "text-amber-400"
              : "text-emerald-700 hover:text-emerald-500"
          }`}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
        >
          {isActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-400/70" />
          )}
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </button>
      );
    })}
  </div>
);

export default BottomTabBar;
