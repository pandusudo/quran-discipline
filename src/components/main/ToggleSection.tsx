import Toggle from "../Toggle";

interface ToggleSectionProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  isFocusActive: boolean;
}

const ToggleSection = ({
  isEnabled,
  onToggle,
  isFocusActive,
}: ToggleSectionProps) => (
  <div className="flex flex-col items-center gap-3">
    <Toggle
      isEnabled={isEnabled}
      onToggle={onToggle}
      disabled={isFocusActive}
    />
    {isFocusActive ? (
      <p className="text-amber-600 text-xs text-center">
        Toggle locked during focus session
      </p>
    ) : (
      <p className="text-muted-foreground text-xs text-center">
        {isEnabled ? "Tap to pause blocking" : "Tap to enable blocking"}
      </p>
    )}
  </div>
);

export default ToggleSection;
