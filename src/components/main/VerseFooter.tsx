import { LuExternalLink } from "react-icons/lu";
import { BLOCK_REDIRECT_URL } from "../../helpers/config";

const VerseFooter = () => {
  const handleVisit = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: BLOCK_REDIRECT_URL });
    } else {
      window.open(BLOCK_REDIRECT_URL, "_blank");
    }
  };

  return (
    <div className="px-6 py-2 text-center">
      <p className="text-amber-400/55 text-xs italic leading-relaxed">
        "And seek help through patience and prayer"
      </p>
      <p className="text-emerald-800 text-[10px] mt-1.5">— Al-Baqarah 2:45</p>
      <button
        onClick={handleVisit}
        className="inline-flex items-center gap-1 mt-3 text-emerald-800 hover:text-amber-400/70 text-[10px] transition-colors duration-200"
      >
        <LuExternalLink className="w-2.5 h-2.5" />
        Visit Website
      </button>
    </div>
  );
};

export default VerseFooter;
