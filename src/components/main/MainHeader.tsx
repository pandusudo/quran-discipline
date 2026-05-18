import { LuMoon } from "react-icons/lu";

const MainHeader = () => (
  <div className="flex items-center justify-between px-5 pt-4 pb-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
        <LuMoon className="w-5 h-5 text-amber-400" />
      </div>
      <div>
        <h1 className="text-white font-bold text-base leading-tight tracking-wide">
          Quran Discipline
        </h1>
        <p className="text-emerald-600 text-[11px] tracking-widest uppercase">
          Mindful Browsing
        </p>
      </div>
    </div>
  </div>
);

export default MainHeader;
