import { STORAGE_KEYS } from "./keys";

export interface BlockHistoryEntry {
  id: string;
  domain: string;
  url: string;
  timestamp: string;
  context: "standard" | "focus";
}

export const getBlockHistory = (): Promise<BlockHistoryEntry[]> =>
  chrome.storage.sync
    .get(STORAGE_KEYS.BLOCK_HISTORY)
    .then((r) =>
      Array.isArray(r[STORAGE_KEYS.BLOCK_HISTORY])
        ? (r[STORAGE_KEYS.BLOCK_HISTORY] as BlockHistoryEntry[])
        : [],
    );

export const addBlockHistoryEntry = async (
  entry: Omit<BlockHistoryEntry, "id" | "timestamp">,
): Promise<BlockHistoryEntry> => {
  const history = await getBlockHistory();
  const newEntry: BlockHistoryEntry = {
    ...entry,
    id: `${entry.domain}-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  // Keep only the last 100 entries to avoid storage limits
  const updatedHistory = [newEntry, ...history].slice(0, 100);
  await chrome.storage.sync.set({
    [STORAGE_KEYS.BLOCK_HISTORY]: updatedHistory,
  });
  return newEntry;
};

export const clearBlockHistory = (): Promise<void> =>
  chrome.storage.sync.set({ [STORAGE_KEYS.BLOCK_HISTORY]: [] });
