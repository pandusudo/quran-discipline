interface InfoCardProps {
  isEnabled: boolean;
  isFocusActive: boolean;
}

const InfoCard = ({ isEnabled, isFocusActive }: InfoCardProps) => (
  <div
    className={`w-full rounded-xl border px-4 py-3 text-center transition-colors duration-300 ${
      isFocusActive
        ? "bg-amber-50 border-amber-200"
        : isEnabled
          ? "bg-accent border-border"
          : "bg-muted border-border"
    }`}
  >
    <p
      className={`text-xs leading-relaxed font-medium ${
        isFocusActive
          ? "text-amber-700"
          : isEnabled
            ? "text-accent-foreground"
            : "text-muted-foreground"
      }`}
    >
      {isFocusActive
        ? "Sites are hard-blocked — no bypass during focus"
        : isEnabled
          ? "Blocked sites will display a Qur'an verse"
          : "All websites are currently accessible"}
    </p>
  </div>
);

export default InfoCard;
