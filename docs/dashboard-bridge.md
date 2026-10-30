# Dashboard - extension bridge

This is the contract between the companion dashboard
(`<https://quran.pandusudo.xyz>`, a separate service) and this extension.
Read it before touching anything in `src/entrypoints/background/`,
`src/types/`, or `wxt.config.ts`.

## The short version

There is **exactly one** channel in each direction, and they are not
symmetric:

| Direction             | Mechanism                                                                                                                                           | Where                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Dashboard → extension | `chrome.runtime.onMessageExternal` (Chrome's external message API, gated by `externally_connectable`)                                               | `src/entrypoints/background/index.ts:238`                                               |
| Extension → dashboard | **No messaging.** The extension _navigates the tab_ to the dashboard's block page, and opens the dashboard in a tab on install / from the popup cog | `src/entrypoints/background/index.ts:116`, `:110`, `src/components/main/MainHeader.tsx` |

There are no content scripts, no `onConnectExternal`, no `postMessage`, no
`fetch` to the dashboard, and no `web_accessible_resources`. The popup talks
only to `chrome.storage` (`src/App.tsx`), never to the dashboard.

## 1. Allowing the dashboard: `externally_connectable`

`wxt.config.ts:56-62`:

```ts
...(import.meta.env.WXT_WEB_URL
  ? {
      externally_connectable: {
        matches: [`${import.meta.env.WXT_WEB_URL}/*`],
      },
    }
  : {}),
```

- The key exists **only** when `WXT_WEB_URL` is set at build time. Release
  builds (`.github/workflows/release.yml`) set it to the production origin;
  CI builds set nothing, so CI artifacts have no external bridge at all.
- Chrome enforces the origin match. **The handler does not check the sender**
  — the argument is discarded as `_sender`
  (`src/entrypoints/background/index.ts:239`). That manifest pattern is the
  only gate; never relax it to "make something work".
- The manifest entry must stay inside the `manifest: () => ({...})` function.
  WXT evaluates the config module _before_ it loads `.env`, so a top-level
  `import.meta.env.WXT_WEB_URL` reads `undefined` (see the comment at
  `wxt.config.ts:23-24`).
- `wxt.config.ts` does **not** strip a trailing slash, while
  `src/helpers/config.ts:7-9` does. Build with
  `WXT_WEB_URL=https://example.com/` and you get the broken pattern
  `https://example.com//*`. Always set the variable without a trailing slash.
- The extension ID is not pinned (no `key` in the manifest), so a store build
  and a local unpacked build have **different IDs**. The dashboard targets the
  store ID `acnopcafpacgcbokiagbaednlndhfkdi`; against an unpacked build you
  must point it at your local ID (shown on the `chrome://extensions` card).

### Testing the bridge locally

1. Put the origin you serve the dashboard from into `.env` as `WXT_WEB_URL`.
2. Rebuild and reload the unpacked extension — the manifest only changes on a
   rebuild, and the ID only survives if you reload rather than re-add it.
3. `localhost` is a poor `externally_connectable` match (Chrome match patterns
   want a registrable domain). Prefer a hosts-file alias such as
   `dashboard.local → 127.0.0.1`.
4. If `WXT_WEB_URL` is unset, blocking still works (the redirect URL falls
   back to production), but **no web page can message the extension at all**.

## 2. Message envelope

Request types live in `src/types/` and are unioned into `ExternalMessage`
(`src/types/index.ts:79-104`). Every response is one of
`src/types/response.ts`:

```ts
type ExtensionResponse<T> =
  { ok: true; data: T } | { ok: false; error: string };
```

Built with `ok()` / `err()` from `src/helpers/response.ts`.

The handler (`src/entrypoints/background/index.ts:238-693`) is one big
`switch` on `message.type` inside an async IIFE whose promise is piped to
`sendResponse`. Two things are load-bearing:

- **`return true;` at line 691** keeps the channel open for the async
  response. Remove it and every dashboard call resolves with `undefined`.
- An unknown `type` returns `err("Unknown message type")` (line 685); an
  unexpected throw becomes `err("Internal error")` (line 689).

Dashboard side, the call is:

```ts
chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => { ... });
```

Most mutating messages return the **whole updated array** (rules, site
lists), not just the changed item — the dashboard replaces its state with it.

## 3. Message reference

`BlockMode = "timer" | "audio" | "hard"`. Domains are normalized (scheme,
`www.`, path stripped) by `normalizeDomain` (`src/helpers/url.ts`) before
storage — see the exceptions in §5.

### Rules — `src/types/site.ts`

| Type                    | Payload                                                                                                                           | Success `data`                            | Errors                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET_BLOCK_RULES`       | —                                                                                                                                 | `BlockRule[]`                             | —                                                                                                   |
| `CREATE_RULE`           | `{ blockMode; timerSeconds?; unlockDurationMinutes?; name?; schedule? }`                                                          | `BlockRule[]`                             | — (mode not validated)                                                                              |
| `ADD_SITE_TO_RULE`      | `{ ruleId; domain }`                                                                                                              | `BlockRule[]`                             | `Rule not found`, `Site is already in this rule`                                                    |
| `REMOVE_SITE_FROM_RULE` | `{ ruleId; domain }`                                                                                                              | `BlockRule[]`                             | silent no-op                                                                                        |
| `TOGGLE_SITE`           | `{ ruleId; domain }`                                                                                                              | `BlockRule[]`                             | silent; compares **raw** domain (§5)                                                                |
| `DELETE_RULE`           | `{ ruleId }`                                                                                                                      | `BlockRule[]`                             | silent no-op                                                                                        |
| `UPDATE_RULE`           | `{ ruleId; updates: Partial<Pick<BlockRule, "name" \| "blockMode" \| "timerSeconds" \| "unlockDurationMinutes" \| "schedule">> }` | `BlockRule[]` (id preserved)              | `Rule not found`                                                                                    |
| `IMPORT_DATA`           | `{ mode: "replace" \| "merge"; rules: BlockRule[]; siteLists?: SiteList[] }`                                                      | `ImportSummary` (`src/helpers/import.ts`) | `Invalid import mode`, `Invalid site lists`, `File contains no valid rules`, storage write failures |

`BlockRule` (`src/storage/sites.ts:23-33`):
`{ id; name?; blockMode; timerSeconds; unlockDurationMinutes; schedule: { days: number[]; startTime: "HH:MM"; endTime: "HH:MM" } | null; sites: BlockedSiteEntry[]; createdAt }`.

### Site lists — `src/types/site.ts`

| Type               | Payload                     | Success `data` | Errors                                                 |
| ------------------ | --------------------------- | -------------- | ------------------------------------------------------ |
| `GET_SITE_LISTS`   | —                           | `SiteList[]`   | —                                                      |
| `CREATE_SITE_LIST` | `{ name; sites: string[] }` | `SiteList[]`   | `List name is required`, `List name is too long` (>60) |
| `UPDATE_SITE_LIST` | `{ listId; name?; sites? }` | `SiteList[]`   | `List not found`, name errors                          |
| `DELETE_SITE_LIST` | `{ listId }`                | `SiteList[]`   | silent no-op                                           |

### Unlocks — `src/types/unlock.ts`

Temporary unlocks live in **`chrome.storage.session`**, so they disappear when
the browser session ends.

| Type                 | Payload                                   | Success `data`                                                                                   |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `UNLOCK_SITE`        | `{ domain; durationMinutes; ruleId? }`    | `null`                                                                                           |
| `GET_UNLOCK_STATE`   | `{ domain }`                              | `{ unlockedUntil: number \| null }` (epoch ms; `null` unless _every_ matching rule is satisfied) |
| `GET_UNLOCK_STATES`  | —                                         | `Array<{ domain; unlockedUntil; ruleId? }>` (active entries only)                                |
| `CLEAR_UNLOCK_STATE` | `{ domain }` — **ignored by the handler** | `null` (only prunes expired entries)                                                             |

Always-block-list hosts (`isHaramHost`) are never unlockable and are skipped
by the state queries.

### History, settings, Pomodoro

| Type                     | Payload                                                | Success `data`                                            |
| ------------------------ | ------------------------------------------------------ | --------------------------------------------------------- |
| `GET_BLOCK_HISTORY`      | —                                                      | `BlockHistoryEntry[]` (max 100, newest first)             |
| `CLEAR_BLOCK_HISTORY`    | —                                                      | `null`                                                    |
| `GET_SETTINGS`           | —                                                      | `ExtensionSettings`                                       |
| `UPDATE_SETTINGS`        | `Partial<ExtensionSettings>`                           | merged `ExtensionSettings`                                |
| `GET_POMODORO_SESSION`   | —                                                      | `{ isActive: boolean; session: PomodoroSession \| null }` |
| `GET_POMODORO_STATS`     | —                                                      | `PomodoroStats`                                           |
| `START_POMODORO_SESSION` | `{ listId; focusDuration; restDuration; totalCycles }` | `{ isActive: true; session }`                             |
| `STOP_POMODORO_SESSION`  | —                                                      | `{ isActive: false; session }`                            |

`START_POMODORO_SESSION` validates `focusDuration` (1–180),
`restDuration` (1–60), `totalCycles` (1–12) and that the list exists and is
non-empty; it creates the `focus-phase-end` alarm. `isActive` reflects the
focus phase actually blocking, not merely that a session object exists.

### Block page lookup

| Type              | Payload      | Success `data`                                                               | Errors           |
| ----------------- | ------------ | ---------------------------------------------------------------------------- | ---------------- |
| `GET_SITE_CONFIG` | `{ domain }` | `{ blockMode; timerSeconds; unlockDurationMinutes; ruleId: string \| null }` | `Site not found` |

Precedence: always-block host → forced `hard` with `ruleId: null`; else the
strictest still-blocking matching rule; else the strictest matching rule; else
the newest matching rule with no filters.

## 4. Extension → dashboard: the block page redirect

On every top-level https navigation (`webNavigation.onBeforeNavigate`,
`frameId === 0`) the background worker evaluates blocking
(`src/helpers/blocking.ts`) and, if it fires, books history and redirects the
tab (`src/entrypoints/background/index.ts:177-184`):

```
{origin}/blocked?blocked_site=<full original URL>&context=standard|focus&is_haram_site=true|false
```

| Param           | Meaning                                                   |
| --------------- | --------------------------------------------------------- |
| `blocked_site`  | the URL the user tried to open (percent-encoded)          |
| `context`       | `standard` (rule-based) or `focus` (Pomodoro focus phase) |
| `is_haram_site` | host is on the bundled always-block list                  |

The origin comes from `BLOCK_REDIRECT_URL` in `src/helpers/config.ts`
(`WXT_WEB_URL`, falling back to `https://quran.pandusudo.xyz`). The dashboard
origin is also excluded from blocking (`DASHBOARD_HOSTNAMES`,
`src/entrypoints/background/index.ts:50-59`) so a user can never lock
themselves out of it or create a redirect loop.

The other way out to the web: `DASHBOARD_URL` (`{origin}/dashboard`) is opened
on fresh install and from the popup's cog button.

## 5. Storage the bridge reads and writes

All through `chrome.storage.local` except unlocks (`chrome.storage.session`);
access is always via `src/storage/*`, never directly from UI code.

| Key                 | Shape                                              |
| ------------------- | -------------------------------------------------- |
| `blockRules`        | `BlockRule[]`                                      |
| `siteLists`         | `SiteList[]`                                       |
| `blockHistory`      | `BlockHistoryEntry[]`, capped at 100               |
| `extensionSettings` | `ExtensionSettings`                                |
| `pomodoroSession`   | `PomodoroSession` (snapshot of the list's domains) |
| `pomodoroStats`     | `{ totalFocusSeconds; daily }`, keeps 40 days      |
| `temporaryUnlocks`  | `TemporaryUnlock[]` — **session** area             |

Legacy paths still run on read: the pre-rules flat `blockedSites` list is
synthesized into rules, `blockMode: "full"` is coerced to `"hard"`, and
`chrome.storage.sync` is migrated into `local` once.

## 6. Gotchas

1. `return true;` at `src/entrypoints/background/index.ts:691` is mandatory.
2. No sender validation in code — `externally_connectable` is the whole
   security model. Do not widen it.
3. `TOGGLE_SITE` compares the raw `domain` against stored normalized ones, so
   `WWW.Example.com` silently no-ops. Everything else normalizes first.
4. `CLEAR_UNLOCK_STATE` ignores its `domain` payload.
5. `REMOVE_SITE_FROM_RULE`, `DELETE_RULE`, `DELETE_SITE_LIST`, `TOGGLE_SITE`
   succeed silently on unknown ids; only their ADD/UPDATE counterparts return
   `... not found`.
6. Domain matching is suffix-based (`matchesHost`): `example.com` covers
   `sub.example.com`, not `notexample.com`. Overlap _across_ rules is legal —
   every matching rule must be satisfied, and the strictest mode
   (`hard` > `audio` > `timer`) decides the block page.
7. During a Pomodoro focus phase unlocks are ignored and the popup toggle is
   locked, in addition to the snapshot list being blocked.
8. Adding or changing a message means touching all three: `src/types/`, the
   `switch` in the background worker, and the dashboard's caller — plus a test
   for any pure-logic change in `src/helpers` or `src/storage`.
9. CI builds intentionally omit `externally_connectable`; do not hardcode the
   production origin in `wxt.config.ts` to "fix" CI.
