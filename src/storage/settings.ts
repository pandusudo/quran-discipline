import { STORAGE_KEYS } from "./keys";
import { storageGet, storageSet } from "./db";

export type TranslationLanguage = "en" | "id";

export interface ExtensionSettings {
  showTranslation: boolean;
  showTransliteration: boolean;
  blockingEnabled: boolean;
  /** Language of the translation shown for verses. */
  translationLanguage: TranslationLanguage;
  isPaid: boolean;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  showTranslation: true,
  showTransliteration: true,
  blockingEnabled: true,
  translationLanguage: "en",
  isPaid: false,
};

/** Fills in keys older builds never wrote and rejects unknown languages. */
const withDefaults = (
  stored: Partial<ExtensionSettings> | undefined,
): ExtensionSettings => {
  const settings: ExtensionSettings = { ...DEFAULT_SETTINGS, ...stored };
  if (
    settings.translationLanguage !== "en" &&
    settings.translationLanguage !== "id"
  ) {
    settings.translationLanguage = DEFAULT_SETTINGS.translationLanguage;
  }
  return settings;
};

export const getSettings = (): Promise<ExtensionSettings> =>
  storageGet(STORAGE_KEYS.SETTINGS).then((r) =>
    withDefaults(r[STORAGE_KEYS.SETTINGS] as Partial<ExtensionSettings>),
  );

export const setSettings = (settings: ExtensionSettings): Promise<void> =>
  storageSet({ [STORAGE_KEYS.SETTINGS]: settings });

export const initStorageDefaults = (): Promise<void> =>
  storageGet(STORAGE_KEYS.SETTINGS).then((result) => {
    if (result[STORAGE_KEYS.SETTINGS] === undefined) {
      return storageSet({
        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
      });
    }
  });
