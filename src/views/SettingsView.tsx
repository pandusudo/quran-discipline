import { useState, useEffect } from "react";
import { BLOCK_REDIRECT_URL } from "../helpers/config";
import { normalizeDomain } from "../helpers/url";
import type { BlockedSite } from "../storage";
import { GeometricDivider } from "../components/GeometricDivider";
import SettingsHeader from "../components/settings/SettingsHeader";
import CurrentTabCard from "../components/settings/CurrentTabCard";
import EditListButton from "../components/settings/EditListButton";
import SettingsFooter from "../components/settings/SettingsFooter";

interface SettingsViewProps {
  blockedSites: BlockedSite[];
  onSave: (sites: BlockedSite[]) => void;
}

const SettingsView = ({ blockedSites, onSave }: SettingsViewProps) => {
  const [sites, setSites] = useState<BlockedSite[]>(blockedSites);
  const [activeTabDomain, setActiveTabDomain] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) setActiveTabDomain(normalizeDomain(tab.url));
      if (tab?.favIconUrl) setFaviconUrl(tab.favIconUrl);
    });
  }, []);

  const redirectDomain = normalizeDomain(BLOCK_REDIRECT_URL);
  const isProtectedDomain = activeTabDomain === redirectDomain;
  const isAlreadyBlocked =
    activeTabDomain !== null && sites.some((s) => s.domain === activeTabDomain);
  const blocked = isAlreadyBlocked || justAdded;

  const handleAddActiveTab = () => {
    if (!activeTabDomain || isAlreadyBlocked || isProtectedDomain) return;
    const newSite: BlockedSite = {
      id: `${activeTabDomain}-${Date.now()}`,
      domain: activeTabDomain,
      category: "other",
      enabled: true,
      addedAt: new Date().toISOString(),
      blockedCount: 0,
      blockMode: "timer",
      timerSeconds: 30,
      unlockDurationMinutes: 5,
    };
    const updated = [...sites, newSite];
    setSites(updated);
    onSave(updated);
    setJustAdded(true);
  };

  const handleRemoveActiveTab = () => {
    if (!activeTabDomain) return;
    const updated = sites.filter((s) => s.domain !== activeTabDomain);
    setSites(updated);
    onSave(updated);
    setJustAdded(false);
  };

  const handleEditList = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: BLOCK_REDIRECT_URL });
    } else {
      window.open(BLOCK_REDIRECT_URL, "_blank");
    }
  };

  return (
    <div className="bg-emerald-950 min-h-120 flex flex-col">
      <SettingsHeader siteCount={sites.length} />

      <GeometricDivider />

      <CurrentTabCard
        activeTabDomain={activeTabDomain}
        faviconUrl={faviconUrl}
        faviconError={faviconError}
        onFaviconError={() => setFaviconError(true)}
        isProtectedDomain={isProtectedDomain}
        isBlocked={blocked}
        onAdd={handleAddActiveTab}
        onRemove={handleRemoveActiveTab}
      />

      <GeometricDivider />

      <EditListButton onClick={handleEditList} />

      <GeometricDivider />

      <SettingsFooter />
    </div>
  );
};

export default SettingsView;
