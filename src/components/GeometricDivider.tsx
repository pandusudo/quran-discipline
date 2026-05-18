export const GeometricDivider = () => (
  <div className="flex items-center gap-3 px-6 my-1">
    <div className="flex-1 h-px bg-linear-to-r from-transparent to-amber-500/30" />
    <svg
      className="w-3 h-3 text-amber-500/50"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l1.8 5.5H19l-4.6 3.4 1.8 5.5L12 13 7.8 16.4l1.8-5.5L5 7.5h5.2z" />
    </svg>
    <div className="flex-1 h-px bg-linear-to-l from-transparent to-amber-500/30" />
  </div>
);
