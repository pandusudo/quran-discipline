import { STORAGE_KEYS } from "./keys";

export interface SiteList {
  id: string;
  name: string;
  /** Normalized domains (no scheme, no "www."). */
  sites: string[];
  createdAt: string;
}

export const getSiteLists = async (): Promise<SiteList[]> => {
  const stored = await chrome.storage.sync.get(STORAGE_KEYS.SITE_LISTS);
  const lists = stored[STORAGE_KEYS.SITE_LISTS];
  if (!Array.isArray(lists)) return [];
  return lists.filter(
    (list): list is SiteList =>
      typeof list === "object" &&
      list !== null &&
      typeof list.id === "string" &&
      typeof list.name === "string" &&
      Array.isArray(list.sites),
  );
};

export const setSiteLists = (lists: SiteList[]): Promise<void> =>
  chrome.storage.sync.set({ [STORAGE_KEYS.SITE_LISTS]: lists });
