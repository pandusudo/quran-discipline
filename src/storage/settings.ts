import { STORAGE_KEYS } from "./keys";

export interface ExtensionSettings {
  showTranslation: boolean;
  showTransliteration: boolean;
  blockingEnabled: boolean;
  isPaid: boolean;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  showTranslation: true,
  showTransliteration: true,
  blockingEnabled: true,
  isPaid: false,
};

export const getSettings = (): Promise<ExtensionSettings> =>
  chrome.storage.sync
    .get(STORAGE_KEYS.SETTINGS)
    .then(
      (r) =>
        (r[STORAGE_KEYS.SETTINGS] as ExtensionSettings) ?? DEFAULT_SETTINGS,
    );

export const setSettings = (settings: ExtensionSettings): Promise<void> =>
  chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });

export const initStorageDefaults = (): Promise<void> =>
  chrome.storage.sync.get(STORAGE_KEYS.SETTINGS).then((result) => {
    if (result[STORAGE_KEYS.SETTINGS] === undefined) {
      return chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
      });
    }
  });
