import { LuPencil, LuArrowRight } from "react-icons/lu";

interface EditListButtonProps {
  onClick: () => void;
}

const EditListButton = ({ onClick }: EditListButtonProps) => (
  <div className="px-5 pt-3 pb-5">
    <p className="text-emerald-600 text-[10px] font-semibold mb-3 uppercase tracking-widest">
      Manage List
    </p>
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-emerald-900/30 border border-emerald-800/40 hover:border-amber-500/30 hover:bg-emerald-900/50 rounded-xl px-4 py-4 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
          <LuPencil className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-left">
          <p className="text-white text-sm font-medium">Edit Block List</p>
          <p className="text-emerald-700 text-xs">Open full list manager</p>
        </div>
      </div>
      <LuArrowRight className="w-4 h-4 text-emerald-700 group-hover:text-amber-400 transition-colors duration-200" />
    </button>
  </div>
);

export default EditListButton;
