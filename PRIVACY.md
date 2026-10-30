# Privacy Policy — Quran Discipline

**Effective date:** 2026-10-29
**Applies to:** the Quran Discipline Chrome extension (this repository)

This policy describes exactly what the extension does with data, verified
against the source code.

## Summary

The extension stores your settings and rules **locally on your device**. It
contains **no analytics, no tracking, no accounts, and no servers of its own**.
The only network destination involved is the companion block-page/dashboard
origin (`https://quran.pandusudo.xyz/`), which the browser navigates to when
a site is blocked or when you open the dashboard.

## Data stored locally

All of the following live in `chrome.storage.local` / `chrome.storage.session`
on your device and are never uploaded by the extension:

| Data                                                                         | Where             | Purpose                                                         |
| ---------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------- |
| Block rules (names, modes, schedules, site lists, per-site blocked counters) | `storage.local`   | Enforce blocking                                                |
| Site lists (for Pomodoro sessions)                                           | `storage.local`   | Choose what a focus session blocks                              |
| Settings (master toggle, translation language/visibility prefs)              | `storage.local`   | Popup and block-page preferences                                |
| Temporary unlocks (domain, rule id, expiry)                                  | `storage.session` | Grant short-lived access; cleared when the browser session ends |
| Block history (last 100 entries: domain, full URL, timestamp, context)       | `storage.local`   | Show you what was blocked                                       |
| Pomodoro session state (selected list snapshot, durations, phase)            | `storage.local`   | Run focus/rest cycles                                           |
| Pomodoro focus-time stats (total + per-day seconds, ~40 days)                | `storage.local`   | Dashboard statistics                                            |

You can clear everything by removing the extension; Chrome's "Clear browser
data → hosted app data" also works.

## Data sent or received

- **No telemetry.** The extension makes no `fetch`/XHR/WebSocket requests and
  loads no remote scripts.
- **Blocked-navigation redirect.** When a blocked site is opened, the browser
  is redirected to:

  `https://quran.pandusudo.xyz/blocked?blocked_site=<the URL you tried to open>&context=<standard|focus>&is_haram_site=<true|false>`

  The attempted URL is therefore visible to the companion service as part of
  normal web-server request logging, the same as any site you visit.

- **Dashboard messages.** The companion dashboard (only from the configured
  origin) may send messages to the extension to manage rules, lists, unlocks,
  history, settings, and Pomodoro sessions. Those messages stay between your
  browser and the extension.
- **First install.** The extension opens the dashboard page in a tab once on
  install.

The companion service at `quran.pandusudo.xyz` is a separate website with its
own operation and policies; this extension's repository does not control it.

## Permissions

The extension requests: `storage`, `alarms`, `webNavigation`, `tabs`, host
access to `https://*/*`, and `externally_connectable` for the dashboard
origin. Their purposes are explained in the
[README permissions table](README.md#permissions).

## Changes

Material changes will be reflected in this file and called out in release
notes. Continued use after changes means acceptance of the updated policy.

## Contact

Questions about privacy: open a GitHub issue or use the contact methods in
[SECURITY.md](SECURITY.md).
