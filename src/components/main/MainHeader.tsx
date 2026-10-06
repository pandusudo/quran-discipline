import { LuSettings } from "react-icons/lu";
import { DASHBOARD_URL } from "../../helpers/config";

const MainHeader = () => {
  const openDashboard = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: DASHBOARD_URL });
    } else {
      window.open(DASHBOARD_URL, "_blank");
    }
  };

  return (
    <div className="bg-sidebar flex items-center gap-2.5 px-5 py-3.5">
      <span className="size-9 shrink-0 overflow-hidden rounded-lg">
        <img
          src="quran-discipline-logo.png"
          alt=""
          className="size-full object-cover"
        />
      </span>
      <div className="min-w-0">
        <h1 className="text-white font-semibold text-[15px] leading-tight tracking-tight">
          Quran Discipline
        </h1>
        <p className="text-white/55 text-[10px] tracking-[0.18em] uppercase leading-tight mt-0.5">
          Stay focused
        </p>
      </div>
      <button
        type="button"
        onClick={openDashboard}
        aria-label="Open dashboard"
        title="Open dashboard"
        className="ml-auto shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-violet/40 transition-colors duration-200"
      >
        <LuSettings className="size-4" />
      </button>
    </div>
  );
};

export default MainHeader;
