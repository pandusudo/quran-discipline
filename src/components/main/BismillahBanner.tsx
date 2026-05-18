const BismillahBanner = () => (
  <div className="text-center px-4 pt-3 pb-2">
    <p
      className="text-amber-400/75 text-2xl leading-loose"
      dir="rtl"
      lang="ar"
      style={{
        fontFamily:
          "'Traditional Arabic', 'Arial Unicode MS', 'Scheherazade New', serif",
      }}
    >
      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
    </p>
    <p className="text-emerald-700/70 text-[10px] mt-1 tracking-widest uppercase">
      In the name of Allah, the Most Gracious, the Most Merciful
    </p>
  </div>
);

export default BismillahBanner;
