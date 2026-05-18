import { LuSettings } from "react-icons/lu";

interface SettingsHeaderProps {
  siteCount: number;
}

const SettingsHeader = ({ siteCount }: SettingsHeaderProps) => (
  <div className="flex items-center gap-3 px-5 pt-5 pb-4">
    <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
      <LuSettings className="w-5 h-5 text-amber-400" />
    </div>
    <div>
      <h2 className="text-white font-bold text-base leading-tight tracking-wide">
        Block List
      </h2>
      <p className="text-emerald-600 text-[11px] tracking-widest uppercase">
        Manage your blocked sites
      </p>
    </div>
    <span className="ml-auto text-emerald-700 text-xs">
      {siteCount} site{siteCount !== 1 ? "s" : ""}
    </span>
  </div>
);

export default SettingsHeader;
