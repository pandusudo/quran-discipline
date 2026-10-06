const BismillahBanner = () => (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <div className="flex">
      <div className="w-1 shrink-0 bg-amber-300" />
      <div className="flex-1 px-4 py-4">
        <p className="text-[10px] text-primary font-semibold uppercase tracking-widest mb-3">
          Bismillah
        </p>
        <p
          className="text-foreground text-2xl font-arabic text-right"
          dir="rtl"
          lang="ar"
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="text-muted-foreground text-xs mt-2 italic">
          “In the name of Allah, the Most Gracious, the Most Merciful”
        </p>
      </div>
    </div>
  </div>
);

export default BismillahBanner;
