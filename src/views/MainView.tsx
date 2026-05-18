import { GeometricDivider } from "../components/GeometricDivider";
import MainHeader from "../components/main/MainHeader";
import BismillahBanner from "../components/main/BismillahBanner";
import StatusBadge from "../components/main/StatusBadge";
import ToggleSection from "../components/main/ToggleSection";
import InfoCard from "../components/main/InfoCard";
import VerseFooter from "../components/main/VerseFooter";

interface MainViewProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  isFocusActive: boolean;
}

const MainView = ({ isEnabled, onToggle, isFocusActive }: MainViewProps) => (
  <div className="bg-emerald-950 min-h-120 flex flex-col">
    <MainHeader />

    <GeometricDivider />

    <BismillahBanner />

    {/* Main Content */}
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 gap-6">
      <StatusBadge isEnabled={isEnabled} isFocusActive={isFocusActive} />
      <ToggleSection
        isEnabled={isEnabled}
        onToggle={onToggle}
        isFocusActive={isFocusActive}
      />
      <InfoCard isEnabled={isEnabled} isFocusActive={isFocusActive} />
    </div>

    <GeometricDivider />

    <VerseFooter />
  </div>
);

export default MainView;
