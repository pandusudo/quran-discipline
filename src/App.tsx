import { useState, useEffect } from "react";
import MainView from "./views/MainView";
import {
  STORAGE_KEYS,
  initStorageDefaults,
  getSettings,
  setSettings,
  getPomodoroSession,
  type PomodoroSession,
  type ExtensionSettings,
} from "./storage";

function App() {
  const [settings, setSettings_] = useState<ExtensionSettings>({
    showTranslation: true,
    showTransliteration: true,
    blockingEnabled: true,
    translationLanguage: "en",
    isPaid: false,
  });
  const [isFocusActive, setIsFocusActive] = useState(false);

  const isFocusActiveNow = (session: PomodoroSession | null): boolean =>
    session?.isActive === true &&
    session.phase === "focus" &&
    Date.now() < session.phaseEndTime;

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    initStorageDefaults();

    Promise.all([getSettings(), getPomodoroSession()]).then(
      ([settingsData, pomodoro]) => {
        setSettings_(settingsData);
        setIsFocusActive(isFocusActiveNow(pomodoro));
      },
    );

    // Keep the pomodoro session and settings in sync when storage changes
    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes[STORAGE_KEYS.POMODORO_SESSION]) {
        setIsFocusActive(
          isFocusActiveNow(
            (changes[STORAGE_KEYS.POMODORO_SESSION]
              .newValue as PomodoroSession | null) ?? null,
          ),
        );
      }
      if (changes[STORAGE_KEYS.SETTINGS]) {
        setSettings_(
          changes[STORAGE_KEYS.SETTINGS].newValue as ExtensionSettings,
        );
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const handleToggle = (enabled: boolean) => {
    const updated = { ...settings, blockingEnabled: enabled };
    setSettings_(updated);
    if (typeof chrome !== "undefined" && chrome.storage) {
      setSettings(updated);
    }
  };

  return (
    <div className="w-95 flex flex-col overflow-hidden">
      <div className="flex-1">
        <MainView
          isEnabled={settings.blockingEnabled}
          onToggle={handleToggle}
          isFocusActive={isFocusActive}
        />
      </div>
    </div>
  );
}

export default App;
