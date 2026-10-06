import type {
  BlockRule,
  BlockedSiteEntry,
  BlockMode,
  RuleSchedule,
  SiteList,
} from "../storage";
import type { ImportMode } from "../types";
import { normalizeDomain } from "./url";

export interface ImportSummary {
  mode: ImportMode;
  addedRules: number;
  skippedRules: number;
  addedSites: number;
  skippedSites: number;
  totalRules: number;
  addedLists: number;
  skippedLists: number;
  totalLists: number;
}

export interface ImportResult {
  rules: BlockRule[];
  summary: ImportSummary;
}

const BLOCK_MODES: BlockMode[] = ["timer", "audio", "hard"];
const TIME_PATTERN = /^\d{2}:\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const sanitizeSchedule = (raw: unknown): RuleSchedule | null => {
  if (!isRecord(raw)) return null;

  const days = Array.isArray(raw.days)
    ? raw.days.filter(
        (day): day is number =>
          typeof day === "number" &&
          Number.isInteger(day) &&
          day >= 0 &&
          day <= 6,
      )
    : [];
  const startTime = typeof raw.startTime === "string" ? raw.startTime : "";
  const endTime = typeof raw.endTime === "string" ? raw.endTime : "";

  if (
    days.length === 0 ||
    !TIME_PATTERN.test(startTime) ||
    !TIME_PATTERN.test(endTime)
  ) {
    return null;
  }

  return { days, startTime, endTime };
};

const sanitizeSite = (
  raw: unknown,
  fallbackAddedAt: string,
): BlockedSiteEntry | null => {
  if (!isRecord(raw)) return null;

  const domain =
    typeof raw.domain === "string" ? normalizeDomain(raw.domain) : "";
  if (!domain) return null;

  return {
    domain,
    addedAt: typeof raw.addedAt === "string" ? raw.addedAt : fallbackAddedAt,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : true,
    blockedCount: Math.max(
      0,
      Math.round(toFiniteNumber(raw.blockedCount, 0)),
    ),
  };
};

interface SanitizedRule {
  rule: BlockRule;
  /** Sites dropped because the domain was invalid or repeated in the rule. */
  droppedSites: number;
}

const sanitizeRule = (
  raw: unknown,
  index: number,
  fallbackId: string,
): SanitizedRule | null => {
  if (!isRecord(raw)) return null;

  const rawMode = raw.blockMode;
  if (rawMode !== "full" && !BLOCK_MODES.includes(rawMode as BlockMode)) {
    return null;
  }

  const now = new Date().toISOString();
  const name = typeof raw.name === "string" ? raw.name.trim() : "";

  const rawSites = Array.isArray(raw.sites) ? raw.sites : [];
  const sites: BlockedSiteEntry[] = [];
  const seenDomains = new Set<string>();
  for (const site of rawSites) {
    const entry = sanitizeSite(site, now);
    if (!entry || seenDomains.has(entry.domain)) continue;
    seenDomains.add(entry.domain);
    sites.push(entry);
  }

  return {
    droppedSites: rawSites.length - sites.length,
    rule: {
    id:
      typeof raw.id === "string" && raw.id.trim().length > 0
        ? raw.id.trim()
        : `${fallbackId}-${index}`,
    ...(name ? { name } : {}),
    blockMode: rawMode === "full" ? "hard" : (rawMode as BlockMode),
    timerSeconds: Math.max(0, Math.round(toFiniteNumber(raw.timerSeconds, 30))),
    unlockDurationMinutes: Math.max(
      0,
      Math.round(toFiniteNumber(raw.unlockDurationMinutes, 5)),
    ),
      schedule: sanitizeSchedule(raw.schedule),
      sites,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    },
  };
};

/**
 * Normalise an arbitrary payload (usually parsed from an exported JSON file)
 * into a full rule set for the requested import mode.
 *
 * - `replace`: the incoming rules become the entire set.
 * - `merge`: existing rules are kept; incoming rules whose id already exists
 *   are skipped. The same domain may appear in several rules.
 */
export const buildImportResult = (
  raw: unknown,
  mode: ImportMode,
  existing: BlockRule[],
): ImportResult | null => {
  if (!Array.isArray(raw)) return null;

  const base: BlockRule[] = mode === "merge" ? existing : [];

  const rules: BlockRule[] = [...base];
  const knownIds = new Set(base.map((rule) => rule.id));

  let addedRules = 0;
  let skippedRules = 0;
  let addedSites = 0;
  let skippedSites = 0;

  raw.forEach((entry, index) => {
    const sanitized = sanitizeRule(entry, index, `rule-${Date.now()}`);
    if (!sanitized) {
      skippedRules += 1;
      return;
    }

    const { rule, droppedSites } = sanitized;
    skippedSites += droppedSites;
    if (knownIds.has(rule.id)) {
      skippedRules += 1;
      return;
    }

    // Duplicates across rules are allowed; sanitizeRule already removed
    // repeated domains inside this rule.
    rules.push(rule);
    knownIds.add(rule.id);
    addedRules += 1;
    addedSites += rule.sites.length;
  });

  if (rules.length === 0) return null;

  return {
    rules,
    summary: {
      mode,
      addedRules,
      skippedRules,
      addedSites,
      skippedSites,
      totalRules: rules.length,
      addedLists: 0,
      skippedLists: 0,
      totalLists: 0,
    },
  };
};

export interface SanitizedImportLists {
  lists: SiteList[];
  /** Entries dropped because they were not records or had no valid name. */
  skipped: number;
}

/**
 * Normalise an arbitrary payload from an imported file into site lists:
 * name trimmed (1–60 chars), sites normalised and de-duplicated, missing
 * ids/createdAt filled in. Malformed entries are skipped.
 */
export const sanitizeImportedSiteLists = (
  raw: unknown,
): SanitizedImportLists => {
  if (!Array.isArray(raw)) return { lists: [], skipped: 0 };

  const now = new Date().toISOString();
  const lists: SiteList[] = [];
  let skipped = 0;

  raw.forEach((entry, index) => {
    if (!isRecord(entry)) {
      skipped += 1;
      return;
    }

    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name || name.length > 60) {
      skipped += 1;
      return;
    }

    const rawSites = Array.isArray(entry.sites) ? entry.sites : [];
    const sites: string[] = [];
    for (const site of rawSites) {
      if (typeof site !== "string") continue;
      const normalized = normalizeDomain(site);
      if (normalized && !sites.includes(normalized)) sites.push(normalized);
    }

    const id =
      typeof entry.id === "string" && entry.id.trim().length > 0
        ? entry.id.trim()
        : `list-import-${Date.now()}-${index}`;

    lists.push({
      id,
      name,
      sites,
      createdAt:
        typeof entry.createdAt === "string" && entry.createdAt
          ? entry.createdAt
          : now,
    });
  });

  return { lists, skipped };
};
