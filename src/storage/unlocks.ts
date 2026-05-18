import { STORAGE_KEYS } from "./keys";

export interface TemporaryUnlock {
  domain: string;
  expiresAt: number;
}

export const getTemporaryUnlocks = (): Promise<TemporaryUnlock[]> =>
  chrome.storage.session
    .get(STORAGE_KEYS.TEMPORARY_UNLOCKS)
    .then((r) =>
      Array.isArray(r[STORAGE_KEYS.TEMPORARY_UNLOCKS])
        ? (r[STORAGE_KEYS.TEMPORARY_UNLOCKS] as TemporaryUnlock[])
        : [],
    );

export const setTemporaryUnlocks = (
  unlocks: TemporaryUnlock[],
): Promise<void> =>
  chrome.storage.session.set({ [STORAGE_KEYS.TEMPORARY_UNLOCKS]: unlocks });

export const addTemporaryUnlock = async (
  domain: string,
  durationMinutes: number,
): Promise<TemporaryUnlock> => {
  const unlocks = await getTemporaryUnlocks();
  const expiresAt = Date.now() + durationMinutes * 60 * 1000;
  const newUnlock: TemporaryUnlock = { domain, expiresAt };
  // Replace any existing unlock for the same domain
  const filtered = unlocks.filter((u) => u.domain !== domain);
  await setTemporaryUnlocks([...filtered, newUnlock]);
  return newUnlock;
};

export const getTemporaryUnlock = async (
  domain: string,
): Promise<TemporaryUnlock | null> => {
  const unlocks = await getTemporaryUnlocks();
  const now = Date.now();
  return unlocks.find((u) => u.domain === domain && u.expiresAt > now) ?? null;
};

export const clearTemporaryUnlock = async (domain: string): Promise<void> => {
  const unlocks = await getTemporaryUnlocks();
  await setTemporaryUnlocks(unlocks.filter((u) => u.domain !== domain));
};

export const isTemporarilyUnlocked = async (
  domain: string,
): Promise<boolean> => {
  const unlocks = await getTemporaryUnlocks();
  const now = Date.now();
  // Prune expired entries while we're here
  const active = unlocks.filter((u) => u.expiresAt > now);
  if (active.length !== unlocks.length) {
    await setTemporaryUnlocks(active);
  }
  return active.some(
    (u) => u.domain === domain || domain.endsWith(`.${u.domain}`),
  );
};
