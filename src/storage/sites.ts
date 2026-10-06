import { STORAGE_KEYS } from "./keys";

export type BlockMode = "timer" | "audio" | "hard";

export interface BlockedSiteEntry {
  domain: string;
  addedAt: string;
  enabled: boolean;
  blockedCount: number;
}

export interface RuleSchedule {
  /** Weekdays the rule is active, using JS `Date.getDay()` (0 = Sunday … 6 = Saturday). */
  days: number[];
  /** Start of the active window, "HH:MM" local time (inclusive). */
  startTime: string;
  /** End of the active window, "HH:MM" local time (inclusive). */
  endTime: string;
}

export interface BlockRule {
  id: string;
  name?: string;
  blockMode: BlockMode;
  timerSeconds: number;
  unlockDurationMinutes: number;
  /** When the rule blocks: `null` means active all the time. */
  schedule: RuleSchedule | null;
  sites: BlockedSiteEntry[];
  createdAt: string;
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN;
  return hours * 60 + minutes;
};

export const isRuleActiveNow = (
  rule: Pick<BlockRule, "schedule">,
  now: Date = new Date(),
): boolean => {
  const schedule = rule.schedule;
  if (!schedule) return true;

  const days = Array.isArray(schedule.days) ? schedule.days : [];
  if (days.length === 0) return false;
  if (!days.includes(now.getDay())) return false;

  const start = toMinutes(schedule.startTime);
  const end = toMinutes(schedule.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) return true;
  if (start < end) return current >= start && current <= end;
  // Overnight window, e.g. 22:00 → 06:00.
  return current >= start || current <= end;
};

const LEGACY_BLOCKED_SITES_KEY = "blockedSites";

interface LegacyBlockedSite {
  domain: string;
  enabled?: boolean;
  addedAt?: string;
  blockedCount?: number;
  blockMode?: BlockMode | "full";
  timerSeconds?: number;
  unlockDurationMinutes?: number;
}

const buildRulesFromLegacy = (legacy: unknown): BlockRule[] => {
  if (!Array.isArray(legacy) || legacy.length === 0) return [];

  const rules: BlockRule[] = [];
  const byConfig = new Map<string, BlockRule>();
  const now = new Date().toISOString();

  for (const site of legacy as LegacyBlockedSite[]) {
    if (!site?.domain) continue;
    const blockMode: BlockMode =
      (site.blockMode === "full" ? "hard" : site.blockMode) ?? "timer";
    const timerSeconds = site.timerSeconds ?? 30;
    const unlockDurationMinutes = site.unlockDurationMinutes ?? 5;
    const key = `${blockMode}:${timerSeconds}:${unlockDurationMinutes}`;

    let rule = byConfig.get(key);
    if (!rule) {
      rule = {
        id: `rule-${Date.now()}-${rules.length}`,
        blockMode,
        timerSeconds,
        unlockDurationMinutes,
        schedule: null,
        sites: [],
        createdAt: now,
      };
      byConfig.set(key, rule);
      rules.push(rule);
    }

    rule.sites.push({
      domain: site.domain,
      addedAt: site.addedAt ?? now,
      enabled: site.enabled ?? true,
      blockedCount: site.blockedCount ?? 0,
    });
  }

  return rules;
};

export const getBlockRules = async (): Promise<BlockRule[]> => {
  const stored = await chrome.storage.sync.get([
    STORAGE_KEYS.BLOCK_RULES,
    LEGACY_BLOCKED_SITES_KEY,
  ]);

  const existing = Array.isArray(stored[STORAGE_KEYS.BLOCK_RULES])
    ? (stored[STORAGE_KEYS.BLOCK_RULES] as BlockRule[])
    : [];

  let rules = existing;
  if (existing.length === 0) {
    rules = buildRulesFromLegacy(stored[LEGACY_BLOCKED_SITES_KEY]);
    if (rules.length > 0) await setBlockRules(rules);
  }

  if (LEGACY_BLOCKED_SITES_KEY in stored) {
    await chrome.storage.sync.remove(LEGACY_BLOCKED_SITES_KEY);
  }

  return rules.map((rule) => ({
    ...rule,
    // Migrate legacy rules that stored the mode as "full".
    blockMode: (rule.blockMode as string) === "full" ? "hard" : rule.blockMode,
    schedule: rule.schedule ?? null,
  }));
};

export const setBlockRules = (rules: BlockRule[]): Promise<void> =>
  chrome.storage.sync.set({ [STORAGE_KEYS.BLOCK_RULES]: rules });

interface GoverningRuleOptions {
  /** Only consider rules whose schedule is active right now. Defaults to `true`. */
  activeOnly?: boolean;
  /** Only consider rules where the matching site entry is enabled. Defaults to `true`. */
  enabledOnly?: boolean;
}

const matchesHost = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname.endsWith(`.${domain}`);

const isNewerRule = (
  candidate: BlockRule,
  candidateIndex: number,
  current: BlockRule,
  currentIndex: number,
): boolean => {
  const candidateTime = Date.parse(candidate.createdAt);
  const currentTime = Date.parse(current.createdAt);
  if (
    Number.isFinite(candidateTime) &&
    Number.isFinite(currentTime) &&
    candidateTime !== currentTime
  ) {
    return candidateTime > currentTime;
  }
  // Same creation time (or unparsable): the rule added later wins.
  return candidateIndex > currentIndex;
};

/**
 * The rule that governs a hostname: among the rules that currently match
 * (optionally only active ones), the most recently created rule wins. This
 * lets the same site live in several rules with different modes/schedules.
 */
export const findGoverningRule = (
  rules: BlockRule[],
  hostname: string,
  options: GoverningRuleOptions = {},
): BlockRule | null => {
  const { activeOnly = true, enabledOnly = true } = options;

  let winner: BlockRule | null = null;
  let winnerIndex = -1;

  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];
    if (activeOnly && !isRuleActiveNow(rule)) continue;

    const matches = rule.sites.some(
      (site) =>
        (!enabledOnly || site.enabled) && matchesHost(hostname, site.domain),
    );
    if (!matches) continue;

    if (!winner || isNewerRule(rule, index, winner, winnerIndex)) {
      winner = rule;
      winnerIndex = index;
    }
  }

  return winner;
};

export const incrementSiteBlockedCount = async (
  domain: string,
): Promise<void> => {
  const rules = await getBlockRules();
  const governing = findGoverningRule(rules, domain);
  if (!governing) return;

  const updated = rules.map((rule) =>
    rule.id !== governing.id
      ? rule
      : {
          ...rule,
          sites: rule.sites.map((site) =>
            site.domain === domain || domain.endsWith(`.${site.domain}`)
              ? { ...site, blockedCount: site.blockedCount + 1 }
              : site,
          ),
        },
  );
  await setBlockRules(updated);
};
