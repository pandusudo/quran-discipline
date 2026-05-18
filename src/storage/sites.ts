import { STORAGE_KEYS } from "./keys";

export interface BlockedSite {
  id: string;
  domain: string;
  category: string;
  enabled: boolean;
  addedAt: string;
  blockedCount: number;
  blockMode: "timer" | "audio" | "hard";
  timerSeconds: number;
  unlockDurationMinutes: number;
}

export const getBlockedSites = (): Promise<BlockedSite[]> =>
  chrome.storage.sync
    .get(STORAGE_KEYS.BLOCKED_SITES)
    .then((r) =>
      Array.isArray(r[STORAGE_KEYS.BLOCKED_SITES])
        ? (r[STORAGE_KEYS.BLOCKED_SITES] as BlockedSite[])
        : [],
    );

export const setBlockedSites = (sites: BlockedSite[]): Promise<void> =>
  chrome.storage.sync.set({ [STORAGE_KEYS.BLOCKED_SITES]: sites });

export const incrementBlockedCount = async (domain: string): Promise<void> => {
  const sites = await getBlockedSites();
  const updated = sites.map((site) =>
    site.domain === domain || domain.endsWith(`.${site.domain}`)
      ? { ...site, blockedCount: site.blockedCount + 1 }
      : site,
  );
  await setBlockedSites(updated);
};
