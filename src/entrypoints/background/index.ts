import {
  ALARM_NAMES,
  getPomodoroSession,
  setPomodoroSession,
  clearLegacyFocusSession,
  getBlockRules,
  setBlockRules,
  getSiteLists,
  setSiteLists,
  addBlockHistoryEntry,
  incrementSiteBlockedCount,
  getBlockHistory,
  clearBlockHistory,
  addTemporaryUnlock,
  getActiveTemporaryUnlocks,
  isRuleSatisfied,
  getCoveringUnlockExpiry,
  findGoverningRule,
  getMatchingRules,
  pickStrictestRule,
  getSettings,
  setSettings,
  ensureStorageMigrated,
  getPomodoroStats,
  addFocusSeconds,
  type PomodoroSession,
  type SiteList,
  type BlockRule,
  type BlockedSiteEntry,
  type ExtensionSettings,
} from "../../storage";
import { BLOCK_REDIRECT_URL, DASHBOARD_URL } from "../../helpers/config";
import type {
  BlockContext,
  ExternalMessage,
  ExtensionResponse,
} from "../../types";
import { matchesDomainList, normalizeDomain } from "../../helpers/url";
import {
  buildImportResult,
  sanitizeImportedSiteLists,
  type ImportSummary,
} from "../../helpers/import";
import { err, ok } from "../../helpers/response";
import haramHosts from "../../data/blocked-hosts.json";

/**
 * Hostnames the dashboard itself answers on. These are never blocked — if a
 * user adds our own domain to a rule they would lock themselves out of the
 * dashboard (where the block page lives, which would also loop).
 */
const DASHBOARD_HOSTNAMES = (() => {
  const own = new URL(BLOCK_REDIRECT_URL).hostname
    .replace(/^www\./, "")
    .toLowerCase();
  const hosts = new Set([own]);
  if (own === "localhost" || own === "127.0.0.1" || own === "[::1]") {
    for (const alias of ["localhost", "127.0.0.1", "[::1]"]) hosts.add(alias);
  }
  return hosts;
})();

/** Built-in list of hosts that are always blocked and can never be unlocked. */
const isHaramHost = (hostname: string): boolean =>
  hostname in haramHosts ||
  Object.keys(haramHosts).some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

const sanitizeSites = (sites: unknown): string[] => {
  if (!Array.isArray(sites)) return [];
  const out: string[] = [];
  for (const site of sites) {
    if (typeof site !== "string") continue;
    const normalized = normalizeDomain(site);
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
};

/** `isActive` here means "focus phase is blocking right now". */
const buildSessionState = (session: PomodoroSession | null) => ({
  isActive:
    session?.isActive === true &&
    session.phase === "focus" &&
    Date.now() < session.phaseEndTime,
  session,
});

/**
 * Credits the focus time already spent on the phase that is ending (or is
 * about to be cut short by a stop/replace). Capped at one full phase so an
 * alarm that fires hours late cannot over-count.
 */
const creditFocusTime = (session: PomodoroSession | null): Promise<void> => {
  if (!session?.isActive || session.phase !== "focus") return Promise.resolve();

  const phaseMs = session.focusDuration * 60 * 1000;
  const elapsedMs = phaseMs - (session.phaseEndTime - Date.now());
  const seconds = Math.min(Math.max(elapsedMs, 0), phaseMs) / 1000;

  return addFocusSeconds(seconds).catch(() => undefined);
};

// Intercept web navigations to enforce blocking rules
export default defineBackground(() => {
  // Copy any state older builds left in chrome.storage.sync into
  // chrome.storage.local before the first navigation event reads it.
  void ensureStorageMigrated();

  // Drop the pre-pomodoro mock session data (idempotent).
  void clearLegacyFocusSession();

  // Open the dashboard right after a fresh install.
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.tabs.create({ url: DASHBOARD_URL });
    }
  });

  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only intercept top-level navigations, not iframes or sub-resources.
    if (details.frameId !== 0) return;

    const url = new URL(details.url);
    const hostname = url.hostname.replace(/^www\./, "");

    // Never block our own dashboard, even if its domain slipped into a rule.
    if (DASHBOARD_HOSTNAMES.has(hostname)) return;

    const [settings, blockRules, session] = await Promise.all([
      getSettings(),
      getBlockRules(),
      getPomodoroSession(),
    ]);

    const isEnabled = settings.blockingEnabled;

    // Active pomodoro focus phase — no unlock, and the selected list's
    // sites are blocked on top of the usual rules.
    const isFocusBlocking =
      session?.isActive === true &&
      session.phase === "focus" &&
      Date.now() < session.phaseEndTime;

    const isInPomodoroList =
      isFocusBlocking && session !== null
        ? matchesDomainList(session.domains, hostname)
        : false;

    // Every matching rule unlocks on its own: the site stays blocked as long
    // as at least one active rule has not been unlocked for this hostname.
    const matchingRules = getMatchingRules(blockRules, hostname);
    const activeUnlocks =
      matchingRules.length > 0 ? await getActiveTemporaryUnlocks() : [];
    const ruleBlockers = matchingRules.filter(
      (rule) => !isRuleSatisfied(activeUnlocks, rule.id, hostname),
    );

    const isInHaramList = isHaramHost(hostname);
    const isBlocked = ruleBlockers.length > 0 || isInHaramList;

    // During an active pomodoro focus phase, block regardless of temporary
    // unlock status or the blocking toggle.
    const shouldBlock = isFocusBlocking
      ? matchingRules.length > 0 || isInHaramList || isInPomodoroList
      : isBlocked && isEnabled;

    if (!shouldBlock) return;

    const context: BlockContext = isFocusBlocking ? "focus" : "standard";

    // Record block history and count it on the rule the block page shows —
    // the strictest rule still blocking (all matching rules during focus).
    const governing = pickStrictestRule(
      isFocusBlocking ? matchingRules : ruleBlockers,
    );
    await Promise.all([
      // Bookkeeping must never keep the block page from loading.
      addBlockHistoryEntry({ domain: hostname, url: details.url, context }).catch(
        () => undefined,
      ),
      ...(governing
        ? [
            incrementSiteBlockedCount(hostname, governing.id).catch(
              () => undefined,
            ),
          ]
        : []),
    ]);

    const params = new URLSearchParams({
      blocked_site: details.url,
      context,
      is_haram_site: isInHaramList.toString(),
    });
    chrome.tabs.update(details.tabId, {
      url: `${BLOCK_REDIRECT_URL}/blocked?${params.toString()}`,
    });
  });

  // Handle focus/rest cycle timing
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAMES.FOCUS_PHASE_END) {
      getPomodoroSession().then((session: PomodoroSession | null) => {
        if (!session?.isActive) return;

        // Bookkeeping must never block the phase transition.
        void creditFocusTime(session);

        // No rest after the last cycle — end the session immediately.
        if (session.currentCycle >= session.totalCycles) {
          setPomodoroSession({ ...session, isActive: false });
          return;
        }

        const restEndTime = Date.now() + session.restDuration * 60 * 1000;
        const updated: PomodoroSession = {
          ...session,
          phase: "rest",
          phaseEndTime: restEndTime,
        };
        setPomodoroSession(updated);
        chrome.alarms.create(ALARM_NAMES.REST_PHASE_END, {
          delayInMinutes: session.restDuration,
        });
      });
    } else if (alarm.name === ALARM_NAMES.REST_PHASE_END) {
      getPomodoroSession().then((session: PomodoroSession | null) => {
        if (!session?.isActive) return;

        if (session.currentCycle < session.totalCycles) {
          // Start next focus cycle
          const focusEndTime = Date.now() + session.focusDuration * 60 * 1000;
          const updated: PomodoroSession = {
            ...session,
            phase: "focus",
            currentCycle: session.currentCycle + 1,
            phaseEndTime: focusEndTime,
          };
          setPomodoroSession(updated);
          chrome.alarms.create(ALARM_NAMES.FOCUS_PHASE_END, {
            delayInMinutes: session.focusDuration,
          });
        } else {
          // All cycles complete — end session
          setPomodoroSession({ ...session, isActive: false });
        }
      });
    }
  });

  chrome.runtime.onMessageExternal.addListener(
    (message: ExternalMessage, _sender, sendResponse) => {
      (async (): Promise<ExtensionResponse> => {
        switch (message.type) {
          case "GET_BLOCK_RULES": {
            const rules = await getBlockRules();
            return ok(rules);
          }
          case "CREATE_RULE": {
            const {
              blockMode,
              timerSeconds = 30,
              unlockDurationMinutes = 5,
              name,
              schedule = null,
            } = message.payload;
            const rules = await getBlockRules();

            const newRule: BlockRule = {
              id: `rule-${Date.now()}`,
              ...(name ? { name } : {}),
              blockMode,
              timerSeconds,
              unlockDurationMinutes,
              schedule: schedule ?? null,
              sites: [],
              createdAt: new Date().toISOString(),
            };
            const updatedAfterCreate = [...rules, newRule];
            await setBlockRules(updatedAfterCreate);
            return ok(updatedAfterCreate);
          }
          case "ADD_SITE_TO_RULE": {
            const { ruleId, domain } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            const rules = await getBlockRules();

            const targetRule = rules.find((r: BlockRule) => r.id === ruleId);
            if (!targetRule) return err("Rule not found");

            // The same domain may live in other rules (different mode or
            // schedule) — only reject duplicates within this rule.
            if (targetRule.sites.some((s) => s.domain === normalizedDomain)) {
              return err("Site is already in this rule");
            }

            const newEntry: BlockedSiteEntry = {
              domain: normalizedDomain,
              addedAt: new Date().toISOString(),
              enabled: true,
              blockedCount: 0,
            };
            const updatedAfterAdd = rules.map((r: BlockRule) =>
              r.id === ruleId ? { ...r, sites: [...r.sites, newEntry] } : r,
            );
            await setBlockRules(updatedAfterAdd);
            return ok(updatedAfterAdd);
          }
          case "REMOVE_SITE_FROM_RULE": {
            const { ruleId, domain } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            const rules = await getBlockRules();
            const updatedAfterRemove = rules.map((r: BlockRule) =>
              r.id === ruleId
                ? {
                    ...r,
                    sites: r.sites.filter((s) => s.domain !== normalizedDomain),
                  }
                : r,
            );
            await setBlockRules(updatedAfterRemove);
            return ok(updatedAfterRemove);
          }
          case "TOGGLE_SITE": {
            const { ruleId, domain } = message.payload;
            const rules = await getBlockRules();
            const updatedAfterToggle = rules.map((r: BlockRule) =>
              r.id === ruleId
                ? {
                    ...r,
                    sites: r.sites.map((s) =>
                      s.domain === domain ? { ...s, enabled: !s.enabled } : s,
                    ),
                  }
                : r,
            );
            await setBlockRules(updatedAfterToggle);
            return ok(updatedAfterToggle);
          }
          case "DELETE_RULE": {
            const { ruleId } = message.payload;
            const rules = await getBlockRules();
            const updatedAfterDelete = rules.filter(
              (r: BlockRule) => r.id !== ruleId,
            );
            await setBlockRules(updatedAfterDelete);
            return ok(updatedAfterDelete);
          }
          case "UPDATE_RULE": {
            const { ruleId, updates } = message.payload;
            const rules = await getBlockRules();
            if (!rules.some((r: BlockRule) => r.id === ruleId))
              return err("Rule not found");
            const updatedAfterUpdate = rules.map((r: BlockRule) =>
              r.id === ruleId ? { ...r, ...updates, id: r.id } : r,
            );
            await setBlockRules(updatedAfterUpdate);
            return ok(updatedAfterUpdate);
          }
          case "GET_SITE_LISTS": {
            return ok(await getSiteLists());
          }
          case "CREATE_SITE_LIST": {
            const name = message.payload.name?.trim() ?? "";
            if (!name) return err("List name is required");
            if (name.length > 60) return err("List name is too long");

            const lists = await getSiteLists();
            const newList: SiteList = {
              id: `list-${Date.now()}`,
              name,
              sites: sanitizeSites(message.payload.sites),
              createdAt: new Date().toISOString(),
            };
            const updated = [...lists, newList];
            await setSiteLists(updated);
            return ok(updated);
          }
          case "UPDATE_SITE_LIST": {
            const { listId, name, sites } = message.payload;
            const lists = await getSiteLists();
            const target = lists.find((l) => l.id === listId);
            if (!target) return err("List not found");

            let nextName = target.name;
            if (name !== undefined) {
              const trimmed = name.trim();
              if (!trimmed) return err("List name is required");
              if (trimmed.length > 60) return err("List name is too long");
              nextName = trimmed;
            }
            const nextSites =
              sites !== undefined ? sanitizeSites(sites) : target.sites;

            const updated = lists.map((l) =>
              l.id === listId
                ? { ...l, name: nextName, sites: nextSites }
                : l,
            );
            await setSiteLists(updated);
            return ok(updated);
          }
          case "DELETE_SITE_LIST": {
            const { listId } = message.payload;
            const lists = await getSiteLists();
            const updated = lists.filter((l) => l.id !== listId);
            await setSiteLists(updated);
            return ok(updated);
          }
          case "GET_BLOCK_HISTORY": {
            const history = await getBlockHistory();
            return ok(history);
          }
          case "CLEAR_BLOCK_HISTORY": {
            await clearBlockHistory();
            return ok(null);
          }
          case "UNLOCK_SITE": {
            const { domain, durationMinutes, ruleId } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            await addTemporaryUnlock(normalizedDomain, durationMinutes, ruleId);
            return ok(null);
          }
          case "GET_UNLOCK_STATE": {
            const { domain } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            const rules = await getBlockRules();
            const matching = getMatchingRules(rules, normalizedDomain);
            // Report an unlock only when the site is fully unblocked: every
            // matching rule unlocked, and never for haram hosts.
            if (matching.length === 0 || isHaramHost(normalizedDomain)) {
              return ok({ unlockedUntil: null });
            }
            const active = await getActiveTemporaryUnlocks();
            const blockers = matching.filter(
              (rule) => !isRuleSatisfied(active, rule.id, normalizedDomain),
            );
            if (blockers.length > 0) return ok({ unlockedUntil: null });
            return ok({
              unlockedUntil: getCoveringUnlockExpiry(active, normalizedDomain),
            });
          }
          case "GET_UNLOCK_STATES": {
            const active = await getActiveTemporaryUnlocks();
            if (active.length === 0) return ok([]);

            // One entry per unlock, `ruleId` included: the dashboard badges a
            // site only on the rule it was actually unlocked for. Entries
            // without a `ruleId` predate per-rule unlocks and apply to every
            // rule covering the domain.
            const seen = new Set<string>();
            const result: {
              domain: string;
              unlockedUntil: number;
              ruleId?: string;
            }[] = [];
            for (const entry of active) {
              // Haram hosts are never satisfied by an unlock.
              if (isHaramHost(entry.domain)) continue;

              const key = `${entry.ruleId ?? "|"}|${entry.domain}`;
              if (seen.has(key)) continue;
              seen.add(key);

              result.push({
                domain: entry.domain,
                unlockedUntil: entry.expiresAt,
                ...(entry.ruleId !== undefined ? { ruleId: entry.ruleId } : {}),
              });
            }
            return ok(result);
          }
          case "CLEAR_UNLOCK_STATE": {
            // Prunes expired entries only — still-valid per-rule unlocks on
            // this domain must survive.
            await getActiveTemporaryUnlocks();
            return ok(null);
          }
          case "GET_SITE_CONFIG": {
            const { domain } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            const rules = await getBlockRules();

            // Haram hosts block unconditionally: always present as hard mode,
            // regardless of which rules also cover the site.
            if (isHaramHost(normalizedDomain)) {
              return ok({
                blockMode: "hard",
                timerSeconds: 0,
                unlockDurationMinutes: 0,
                ruleId: null,
              });
            }

            const matching = getMatchingRules(rules, normalizedDomain);
            const active =
              matching.length > 0 ? await getActiveTemporaryUnlocks() : [];
            const blockers = matching.filter(
              (rule) => !isRuleSatisfied(active, rule.id, normalizedDomain),
            );
            // Show the strictest rule that still blocks; fall back to the
            // strictest matching rule while the site is temporarily open.
            const matchedRule =
              pickStrictestRule(blockers) ??
              pickStrictestRule(matching) ??
              findGoverningRule(rules, normalizedDomain, {
                activeOnly: false,
                enabledOnly: false,
              });
            if (!matchedRule) return err("Site not found");
            return ok({
              blockMode: matchedRule.blockMode,
              timerSeconds: matchedRule.timerSeconds,
              unlockDurationMinutes: matchedRule.unlockDurationMinutes,
              ruleId: matchedRule.id,
            });
          }
          case "IMPORT_DATA": {
            const { mode, rules, siteLists } = message.payload;
            if (mode !== "replace" && mode !== "merge") {
              return err("Invalid import mode");
            }
            if (siteLists !== undefined && !Array.isArray(siteLists)) {
              return err("Invalid site lists");
            }

            const existing = await getBlockRules();
            const result = buildImportResult(rules, mode, existing);
            const { lists: incomingLists, skipped: skippedListEntries } =
              siteLists === undefined
                ? { lists: [], skipped: 0 }
                : sanitizeImportedSiteLists(siteLists);

            if (!result && incomingLists.length === 0) {
              return err("File contains no valid rules");
            }

            let summary: ImportSummary;
            if (result) {
              try {
                await setBlockRules(result.rules);
              } catch (writeError) {
                const detail =
                  writeError instanceof Error
                    ? writeError.message
                    : "Unknown storage error";
                return err(`Failed to write rules to storage: ${detail}`);
              }
              summary = result.summary;
            } else {
              // No usable rules in the file — leave the current rules alone
              // and only apply the site lists (if any).
              summary = {
                mode,
                addedRules: 0,
                skippedRules: Array.isArray(rules) ? rules.length : 0,
                addedSites: 0,
                skippedSites: 0,
                totalRules: existing.length,
                addedLists: 0,
                skippedLists: 0,
                totalLists: 0,
              };
            }

            const existingLists = await getSiteLists();
            let lists = existingLists;
            let addedLists = 0;
            let skippedLists = skippedListEntries;

            // Absent `siteLists` (older export files) leaves lists untouched;
            // `replace` swaps in the file's lists, `merge` appends new ids.
            if (siteLists !== undefined) {
              if (mode === "replace") {
                lists = incomingLists;
                addedLists = incomingLists.length;
              } else {
                const knownIds = new Set(existingLists.map((l) => l.id));
                const merged = [...existingLists];
                for (const list of incomingLists) {
                  if (knownIds.has(list.id)) {
                    skippedLists += 1;
                    continue;
                  }
                  knownIds.add(list.id);
                  merged.push(list);
                  addedLists += 1;
                }
                lists = merged;
              }

              try {
                await setSiteLists(lists);
              } catch (writeError) {
                const detail =
                  writeError instanceof Error
                    ? writeError.message
                    : "Unknown storage error";
                return err(`Failed to write site lists to storage: ${detail}`);
              }
            }

            return ok({
              ...summary,
              addedLists,
              skippedLists,
              totalLists: lists.length,
            });
          }
          case "GET_SETTINGS": {
            const settings = await getSettings();
            return ok(settings);
          }
          case "UPDATE_SETTINGS": {
            const current = await getSettings();
            const updated: ExtensionSettings = {
              ...current,
              ...message.payload,
            };
            await setSettings(updated);
            return ok(updated);
          }
          case "GET_POMODORO_SESSION": {
            const session = await getPomodoroSession();
            return ok(buildSessionState(session));
          }
          case "GET_POMODORO_STATS": {
            return ok(await getPomodoroStats());
          }
          case "START_POMODORO_SESSION": {
            const { listId, focusDuration, restDuration, totalCycles } =
              message.payload;
            if (
              !Number.isFinite(focusDuration) ||
              focusDuration < 1 ||
              focusDuration > 180
            ) {
              return err("Invalid focus duration");
            }
            if (
              !Number.isFinite(restDuration) ||
              restDuration < 1 ||
              restDuration > 60
            ) {
              return err("Invalid rest duration");
            }
            if (
              !Number.isInteger(totalCycles) ||
              totalCycles < 1 ||
              totalCycles > 12
            ) {
              return err("Invalid cycle count");
            }

            const lists = await getSiteLists();
            const list = lists.find((l) => l.id === listId);
            if (!list) return err("List not found");
            if (list.sites.length === 0) return err("List has no sites");

            // Keep the focus time a session already in progress had spent.
            await creditFocusTime(await getPomodoroSession());

            await Promise.all([
              chrome.alarms.clear(ALARM_NAMES.FOCUS_PHASE_END),
              chrome.alarms.clear(ALARM_NAMES.REST_PHASE_END),
            ]);

            const session: PomodoroSession = {
              isActive: true,
              listId: list.id,
              listName: list.name,
              domains: [...list.sites],
              focusDuration,
              restDuration,
              totalCycles,
              currentCycle: 1,
              phase: "focus",
              phaseEndTime: Date.now() + focusDuration * 60 * 1000,
            };
            await setPomodoroSession(session);
            chrome.alarms.create(ALARM_NAMES.FOCUS_PHASE_END, {
              delayInMinutes: focusDuration,
            });

            return ok(buildSessionState(session));
          }
          case "STOP_POMODORO_SESSION": {
            const current = await getPomodoroSession();
            await creditFocusTime(current);

            await Promise.all([
              chrome.alarms.clear(ALARM_NAMES.FOCUS_PHASE_END),
              chrome.alarms.clear(ALARM_NAMES.REST_PHASE_END),
            ]);
            const session = current
              ? { ...current, isActive: false }
              : null;
            if (session) await setPomodoroSession(session);
            return ok(buildSessionState(session));
          }
          default:
            return err("Unknown message type");
        }
      })()
        .then(sendResponse)
        .catch(() => sendResponse(err("Internal error")));

      return true; // Keep the message channel open for the async response
    },
  );
});

export {};
