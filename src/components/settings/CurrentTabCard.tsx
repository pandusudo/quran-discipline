import { LuGlobe, LuLock, LuCheck, LuX } from "react-icons/lu";

interface CurrentTabCardProps {
  activeTabDomain: string | null;
  faviconUrl: string | null;
  faviconError: boolean;
  onFaviconError: () => void;
  isProtectedDomain: boolean;
  isBlocked: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

const CurrentTabCard = ({
  activeTabDomain,
  faviconUrl,
  faviconError,
  onFaviconError,
  isProtectedDomain,
  isBlocked,
  onAdd,
  onRemove,
}: CurrentTabCardProps) => (
  <div className="px-5 pt-5 pb-3">
    <p className="text-emerald-600 text-[10px] font-semibold mb-3 uppercase tracking-widest">
      Current Tab
    </p>
    <div className="bg-emerald-900/30 border border-emerald-800/40 rounded-xl p-4">
      {activeTabDomain ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/50 border border-emerald-700/30 flex items-center justify-center shrink-0 overflow-hidden">
              {faviconUrl && !faviconError ? (
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={onFaviconError}
                />
              ) : (
                <LuGlobe className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <span className="text-white text-sm font-medium truncate">
              {activeTabDomain}
            </span>
          </div>

          {isProtectedDomain ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-800/30 border border-emerald-700/30">
              <LuLock className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600 text-sm">
                This site cannot be blocked
              </span>
            </div>
          ) : isBlocked ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <LuCheck className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">
                  Already in your block list
                </span>
              </div>
              <button
                onClick={onRemove}
                className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 active:scale-95 transition-all duration-200"
                title="Remove from block list"
              >
                <LuX className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="w-full py-2.5 bg-amber-500/90 hover:bg-amber-400 active:scale-95 text-emerald-950 font-semibold text-sm rounded-lg transition-all duration-200"
            >
              + Block this site
            </button>
          )}
        </>
      ) : (
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-800/50 border border-emerald-700/30 flex items-center justify-center shrink-0">
            <LuGlobe className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-emerald-700 text-sm">
            No active tab detected
          </span>
        </div>
      )}
    </div>
  </div>
);

export default CurrentTabCard;
