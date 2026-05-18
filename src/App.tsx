import { useState, useEffect } from "react";
import MainView from "./views/MainView";
import SettingsView from "./views/SettingsView";
import FocusSessionView from "./views/FocusSessionView";
import BottomTabBar from "./components/BottomTabBar";
import type { Tab } from "./components/BottomTabBar";
import {
  STORAGE_KEYS,
  initStorageDefaults,
  getSettings,
  setSettings,
  getBlockedSites,
  setBlockedSites,
  getFocusSession,
  type BlockedSite,
  type FocusSession,
  type ExtensionSettings,
} from "./storage";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [settings, setSettings_] = useState<ExtensionSettings>({
    showTranslation: true,
    showTransliteration: true,
    blockingEnabled: true,
  });
  const [blockedSites, setBlockedSites_] = useState<BlockedSite[]>([]);
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    initStorageDefaults();

    Promise.all([getSettings(), getBlockedSites(), getFocusSession()]).then(
      ([settingsData, sites, focus]) => {
        setSettings_(settingsData);
        setBlockedSites_(sites);
        setFocusSession(focus);
      },
    );

    // Keep focusSession and settings in sync when storage changes
    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes[STORAGE_KEYS.FOCUS_SESSION]) {
        setFocusSession(
          changes[STORAGE_KEYS.FOCUS_SESSION].newValue as FocusSession | null,
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

  const handleSaveSites = (sites: BlockedSite[]) => {
    setBlockedSites_(sites);
    if (typeof chrome !== "undefined" && chrome.storage) {
      setBlockedSites(sites);
    }
  };

  const isFocusActive = focusSession?.isActive === true;

  return (
    <div className="w-95 flex flex-col">
      <div className="flex-1">
        {activeTab === "home" && (
          <MainView
            isEnabled={settings.blockingEnabled}
            onToggle={handleToggle}
            isFocusActive={isFocusActive}
          />
        )}
        {activeTab === "focus" && <FocusSessionView />}
        {activeTab === "settings" && (
          <SettingsView blockedSites={blockedSites} onSave={handleSaveSites} />
        )}
      </div>
      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;
