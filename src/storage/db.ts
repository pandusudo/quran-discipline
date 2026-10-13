/**
 * Persistent state lives in `chrome.storage.local`: `chrome.storage.sync`
 * caps every single item at 8 KB (QUOTA_BYTES_PER_ITEM) and the whole area
 * at 100 KB, which block rules, site lists and block history all outgrow.
 * `local` has no per-item cap (10 MB total).
 *
 * Builds up to v1.2 kept that state in `sync`, so it is copied over once on
 * first access. Every read/write in this folder goes through the helpers
 * below, which makes the migration a prerequisite of any storage access.
 */

const SYNC_MIGRATED_FLAG = "syncMigratedToLocal";

let migration: Promise<void> | null = null;

const migrateFromSync = async (): Promise<void> => {
  const local = await chrome.storage.local.get(SYNC_MIGRATED_FLAG);
  if (local[SYNC_MIGRATED_FLAG] === true) return;

  const legacy = await chrome.storage.sync.get(null);
  const keys = Object.keys(legacy);

  await chrome.storage.local.set({ ...legacy, [SYNC_MIGRATED_FLAG]: true });
  if (keys.length > 0) await chrome.storage.sync.remove(keys);
};

/** Runs the sync → local copy at most once per document/service worker. */
export const ensureStorageMigrated = (): Promise<void> => {
  if (!migration) {
    migration = migrateFromSync().catch((error) => {
      // Leave the flag unset so the next access retries, but never block
      // reads/writes on a migration failure.
      migration = null;
      console.error("[quran-discipline] storage migration failed", error);
    });
  }
  return migration;
};

export const storageGet = async (
  keys: string | string[] | null,
): Promise<{ [key: string]: unknown }> => {
  await ensureStorageMigrated();
  return chrome.storage.local.get(keys);
};

export const storageSet = async (items: {
  [key: string]: unknown;
}): Promise<void> => {
  await ensureStorageMigrated();
  await chrome.storage.local.set(items);
};

export const storageRemove = async (keys: string | string[]): Promise<void> => {
  await ensureStorageMigrated();
  await chrome.storage.local.remove(keys);
};
