interface InfoCardProps {
  isEnabled: boolean;
  isFocusActive: boolean;
}

const InfoCard = ({ isEnabled, isFocusActive }: InfoCardProps) => (
  <div className="w-full bg-emerald-900/20 rounded-xl border border-emerald-800/30 px-4 py-3 text-center">
    <p className="text-emerald-600 text-xs leading-relaxed">
      {isFocusActive
        ? "🔒 Sites are hard-blocked — no bypass during focus"
        : isEnabled
          ? "🛡️ Blocked sites will display a Qur'an verse"
          : "⚠️ All websites are currently accessible"}
    </p>
  </div>
);

export default InfoCard;
