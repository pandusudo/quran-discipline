import { LuExternalLink } from "react-icons/lu";
import { BLOCK_REDIRECT_URL } from "../../helpers/config";

const SettingsFooter = () => {
  const handleVisit = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: BLOCK_REDIRECT_URL });
    } else {
      window.open(BLOCK_REDIRECT_URL, "_blank");
    }
  };

  return (
    <div className="mt-auto">
      <div className="px-5 py-3 text-center flex flex-col items-center gap-1.5">
        <p className="text-emerald-800 text-[10px]">
          Changes are saved automatically
        </p>
        <button
          onClick={handleVisit}
          className="inline-flex items-center gap-1 text-emerald-800 hover:text-amber-400/70 text-[10px] transition-colors duration-200"
        >
          <LuExternalLink className="w-2.5 h-2.5" />
          Visit Website
        </button>
      </div>
    </div>
  );
};

export default SettingsFooter;
