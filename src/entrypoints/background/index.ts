import {
  ALARM_NAMES,
  getFocusSession,
  getBlockedSites,
  setBlockedSites,
  setFocusSession,
  addBlockHistoryEntry,
  incrementBlockedCount,
  getBlockHistory,
  clearBlockHistory,
  addTemporaryUnlock,
  getTemporaryUnlock,
  clearTemporaryUnlock,
  isTemporarilyUnlocked,
  getSettings,
  setSettings,
  type FocusSession,
  type BlockedSite,
  type ExtensionSettings,
} from "../../storage";
import { BLOCK_REDIRECT_URL } from "../../helpers/config";
import type {
  BlockContext,
  ExternalMessage,
  ExtensionResponse,
} from "../../types";
import { normalizeDomain } from "../../helpers/url";
import { err, ok } from "../../helpers/response";
import haramHosts from "../../data/blocked-hosts.json";

// Intercept web navigations to enforce blocking rules
export default defineBackground(() => {
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only intercept top-level navigations, not iframes or sub-resources.
    if (details.frameId !== 0) return;

    // Never redirect the block page itself to avoid an infinite loop.
    if (details.url.startsWith(BLOCK_REDIRECT_URL)) return;

    const url = new URL(details.url);
    const hostname = url.hostname.replace(/^www\./, "");

    const [settings, blockedSites, focusSession] = await Promise.all([
      getSettings(),
      getBlockedSites(),
      getFocusSession(),
    ]);

    const isEnabled = settings.blockingEnabled;

    const isFocusBlocking =
      focusSession?.isActive === true &&
      focusSession.phase === "focus" &&
      Date.now() < focusSession.phaseEndTime;

    const isInUserList = blockedSites.some(
      (site: BlockedSite) =>
        site.enabled &&
        (hostname === site.domain || hostname.endsWith(`.${site.domain}`)),
    );

    const isInHaramList =
      hostname in haramHosts ||
      Object.keys(haramHosts).some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );

    const isBlocked = isInUserList || isInHaramList;

    const temporarilyUnlocked = isBlocked
      ? await isTemporarilyUnlocked(hostname)
      : false;

    // During focus mode, block regardless of temporary unlock status
    const shouldBlock = isFocusBlocking
      ? isBlocked
      : isBlocked && !temporarilyUnlocked && isEnabled;

    if (!shouldBlock) return;

    const context: BlockContext = isFocusBlocking ? "focus" : "standard";

    // Record block history and increment count
    await Promise.all([
      addBlockHistoryEntry({ domain: hostname, url: details.url, context }),
      incrementBlockedCount(hostname),
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
      getFocusSession().then((session: FocusSession | null) => {
        if (!session?.isActive) return;

        // No rest after the last cycle — end the session immediately.
        if (session.currentCycle >= session.totalCycles) {
          setFocusSession({ ...session, isActive: false });
          return;
        }

        const restEndTime = Date.now() + session.restDuration * 60 * 1000;
        const updated: FocusSession = {
          ...session,
          phase: "rest",
          phaseEndTime: restEndTime,
        };
        setFocusSession(updated);
        chrome.alarms.create(ALARM_NAMES.REST_PHASE_END, {
          delayInMinutes: session.restDuration,
        });
      });
    } else if (alarm.name === ALARM_NAMES.REST_PHASE_END) {
      getFocusSession().then((session: FocusSession | null) => {
        if (!session?.isActive) return;

        if (session.currentCycle < session.totalCycles) {
          // Start next focus cycle
          const focusEndTime = Date.now() + session.focusDuration * 60 * 1000;
          const updated: FocusSession = {
            ...session,
            phase: "focus",
            currentCycle: session.currentCycle + 1,
            phaseEndTime: focusEndTime,
          };
          setFocusSession(updated);
          chrome.alarms.create(ALARM_NAMES.FOCUS_PHASE_END, {
            delayInMinutes: session.focusDuration,
          });
        } else {
          // All cycles complete — end session
          setFocusSession({ ...session, isActive: false });
        }
      });
    }
  });

  chrome.runtime.onMessageExternal.addListener(
    (message: ExternalMessage, _sender, sendResponse) => {
      (async (): Promise<ExtensionResponse> => {
        switch (message.type) {
          case "GET_BLOCKED_SITES": {
            const sites = await getBlockedSites();
            return ok(sites);
          }
          case "ADD_SITE": {
            const {
              domain,
              category,
              blockMode = "timer",
              timerSeconds = 30,
              unlockDurationMinutes = 5,
            } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            const sites = await getBlockedSites();

            if (sites.some((s: BlockedSite) => s.domain === normalizedDomain)) {
              return err("Site already exists");
            }

            const newSite: BlockedSite = {
              id: `${normalizedDomain}-${Date.now()}`,
              domain: normalizedDomain,
              category,
              enabled: true,
              addedAt: new Date().toISOString(),
              blockedCount: 0,
              blockMode,
              timerSeconds,
              unlockDurationMinutes,
            };

            const updatedAfterAdd = [...sites, newSite];
            await setBlockedSites(updatedAfterAdd);
            return ok(updatedAfterAdd);
          }
          case "TOGGLE_SITE": {
            const { id } = message.payload;
            const sites = await getBlockedSites();
            const updatedAfterToggle = sites.map((s: BlockedSite) =>
              s.id === id ? { ...s, enabled: !s.enabled } : s,
            );
            await setBlockedSites(updatedAfterToggle);
            return updatedAfterToggle.some((s: BlockedSite) => s.id === id)
              ? ok(updatedAfterToggle)
              : err("Site not found");
          }
          case "DELETE_SITE": {
            const { id } = message.payload;
            const sites = await getBlockedSites();
            const updatedAfterDelete = sites.filter(
              (s: BlockedSite) => s.id !== id,
            );
            await setBlockedSites(updatedAfterDelete);
            return ok(updatedAfterDelete);
          }
          case "UPDATE_SITE": {
            const { id, updates } = message.payload;
            const sites = await getBlockedSites();
            if (!sites.some((s: BlockedSite) => s.id === id))
              return err("Site not found");
            const updatedAfterUpdate = sites.map((s: BlockedSite) =>
              s.id === id ? { ...s, ...updates, id: s.id } : s,
            );
            await setBlockedSites(updatedAfterUpdate);
            return ok(updatedAfterUpdate);
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
            const { domain, durationMinutes } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            await addTemporaryUnlock(normalizedDomain, durationMinutes);
            return ok(null);
          }
          case "GET_UNLOCK_STATE": {
            const { domain } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            const unlock = await getTemporaryUnlock(normalizedDomain);
            return ok({ unlockedUntil: unlock ? unlock.expiresAt : null });
          }
          case "CLEAR_UNLOCK_STATE": {
            const { domain } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            await clearTemporaryUnlock(normalizedDomain);
            return ok(null);
          }
          case "GET_SITE_CONFIG": {
            const { domain } = message.payload;
            const normalizedDomain = normalizeDomain(domain);
            const sites = await getBlockedSites();
            console.log(
              "Looking for config of domain:",
              normalizedDomain,
              "in sites:",
              sites,
            );
            const site = sites.find(
              (s: BlockedSite) => s.domain === normalizedDomain,
            );
            if (!site) return err("Site not found");
            return ok({
              blockMode: site.blockMode,
              timerSeconds: site.timerSeconds,
              unlockDurationMinutes: site.unlockDurationMinutes,
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
          case "GET_FOCUS_SESSION": {
            const session = await getFocusSession();
            const isActive =
              session?.isActive === true &&
              session.phase === "focus" &&
              Date.now() < session.phaseEndTime;
            return ok({ isActive, session });
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
