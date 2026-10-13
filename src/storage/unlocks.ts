import { STORAGE_KEYS } from "./keys";
import { matchesHost } from "../helpers/url";

export interface TemporaryUnlock {
  domain: string;
  /**
   * The rule this unlock satisfies. Absent on legacy entries, which then
   * satisfy every rule covering the domain. Haram-list hosts are never
   * satisfied by unlocks at all.
   */
  ruleId?: string;
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
  ruleId?: string,
): Promise<TemporaryUnlock> => {
  const unlocks = await getTemporaryUnlocks();
  const expiresAt = Date.now() + durationMinutes * 60 * 1000;
  const newUnlock: TemporaryUnlock = {
    domain,
    expiresAt,
    ...(ruleId ? { ruleId } : {}),
  };
  // Replace any existing unlock for the same (domain, rule) pair — unlocks
  // for other rules on the same domain must survive.
  const filtered = unlocks.filter(
    (u) => !(u.domain === domain && u.ruleId === ruleId),
  );
  await setTemporaryUnlocks([...filtered, newUnlock]);
  return newUnlock;
};

/** Non-expired unlocks, pruning expired entries from storage along the way. */
export const getActiveTemporaryUnlocks = async (): Promise<
  TemporaryUnlock[]
> => {
  const unlocks = await getTemporaryUnlocks();
  const now = Date.now();
  const active = unlocks.filter((u) => u.expiresAt > now);
  if (active.length !== unlocks.length) {
    await setTemporaryUnlocks(active);
  }
  return active;
};

/** Whether an unlock list lets this rule stop blocking the hostname. */
export const isRuleSatisfied = (
  unlocks: TemporaryUnlock[],
  ruleId: string,
  hostname: string,
): boolean =>
  unlocks.some(
    (u) =>
      matchesHost(hostname, u.domain) &&
      (u.ruleId === undefined || u.ruleId === ruleId),
  );

/**
 * Earliest expiry among unlocks covering the hostname — the moment the site
 * blocks again once every blocking rule has been unlocked — or `null`.
 */
export const getCoveringUnlockExpiry = (
  unlocks: TemporaryUnlock[],
  hostname: string,
): number | null => {
  let earliest: number | null = null;
  for (const unlock of unlocks) {
    if (!matchesHost(hostname, unlock.domain)) continue;
    if (earliest === null || unlock.expiresAt < earliest) {
      earliest = unlock.expiresAt;
    }
  }
  return earliest;
};
