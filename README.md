# Quran Discipline

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![CI](https://github.com/pandusudo/quran-discipline/actions/workflows/ci.yml/badge.svg)](https://github.com/pandusudo/quran-discipline/actions/workflows/ci.yml)

> Beat social media addiction with Quranic reminders — a Chrome extension that
> blocks distracting and harmful sites with per-rule modes and a Pomodoro
> focus timer.

<!-- Screenshots: add docs/screenshots/popup.png and docs/screenshots/blocked.png
     (popup UI and an example block page), then link them here and remove this
     comment. Until then, build and load the extension to see the UI. -->

## Why this exists

Doomscrolling erodes time that could be spent on worship, study, and family.
Quran Discipline interrupts the habit at the moment it matters: when you reach
for a blocked site, you are met with a Qur'an verse instead — a chance to
reset your intention before you continue. It is built as a free, open tool
for anyone trying to reclaim their attention.

## Features

- **Rules** — group sites into rules; each rule has its own:
  - **Block mode**: `timer` (wait out a countdown), `audio` (listen to an
    ayah on the block page), or `hard` (full block, no bypass)
  - **Per-site enable toggles** inside the rule
  - **Schedule** — only active on chosen days/time windows
  - **Temporary unlocks** — grant a site a few minutes of access per rule
- **Always-on block list** — a bundled list of gambling/adult/snuff domains
  that is always blocked and cannot be unlocked (see
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for sources)
- **Pomodoro focus sessions** — pick one of your own site lists, run
  focus/rest cycles; during a focus phase the list is hard-blocked and the
  popup toggle is locked
- **Popup** — one-click pause/resume, live focus status
- **Import/export** — back up or migrate rules and site lists as JSON
  (via the dashboard)
- **Block history** — last 100 blocked navigations, stored locally

> Rules, the Pomodoro timer, and the block page UI are managed from the
> companion dashboard at <https://quran.pandusudo.xyz>. The extension
> intercepts navigations and enforces blocking; the dashboard is a separate
> service that talks to the extension.

## Install

### Chrome Web Store

<!-- Placeholder — update when the listing is live -->

_Coming soon._

### Load unpacked (from source)

1. Clone this repository (or download a release zip).
2. `npm install`
3. `npm run build`
4. Open `chrome://extensions`, enable **Developer mode**.
5. Click **Load unpacked** and select the `.output/chrome-mv3` directory.

To enable the dashboard integration locally, copy `.env.example` to `.env`
and keep `WXT_WEB_URL` set to the dashboard origin before building.

## Development

**Prerequisites:** Node.js 22+, npm.

```bash
git clone https://github.com/pandusudo/quran-discipline.git
cd quran-discipline
npm install

npm run dev        # watch build (web-ext launcher disabled; load .output manually)
npm run build      # production build → .output/chrome-mv3
npm run zip        # store-ready zip in .output
npm test           # unit tests (Vitest)
npm run lint       # ESLint
npm run format     # Prettier write
npm run typecheck  # tsc --noEmit
```

After `npm run dev` or `npm run build`, load/refresh the unpacked extension
from `chrome://extensions`.

## Project structure

```
├── public/                  # Icons and static assets
├── scripts/
│   ├── hosts.txt            # Merged upstream block lists (headers preserved)
│   └── parse-hosts.mjs      # Compiles hosts.txt → src/data/blocked-hosts.json
├── src/
│   ├── data/blocked-hosts.json   # Bundled always-block domain map
│   ├── entrypoints/
│   │   ├── background/      # MV3 service worker: navigation interception, alarms, message API
│   │   └── popup/           # Toolbar popup (React)
│   ├── helpers/             # Pure logic: blocking decision, URLs, import, time
│   ├── storage/             # Typed chrome.storage access + Rules/Pomodoro model
│   ├── types/               # Message and response types
│   ├── views/, components/  # Popup UI
│   └── App.tsx, index.css
├── wxt.config.ts            # Manifest + build config (WXT)
├── eslint.config.js, .prettierrc.json
└── vitest.config.ts
```

### Architecture overview

**Rules model** (`src/storage/sites.ts`): a `BlockRule` owns a block mode, a
timer, an unlock duration, an optional schedule, and a list of sites (each
with its own enable flag and blocked counter). Several rules may cover the
same domain; every matching rule must be satisfied (unlocked) for the site to
open, and the strictest rule (`hard` > `audio` > `timer`) decides what the
block page shows.

**Blocking** (`src/entrypoints/background/index.ts` +
`src/helpers/blocking.ts`): the service worker listens to
`webNavigation.onBeforeNavigate`. For each top-level https navigation it
combines (1) matching rules + temporary unlocks, (2) the popup's master
toggle, (3) the bundled always-block list, and (4) an active Pomodoro focus
phase — then redirects the tab to the block page if needed.

**Pomodoro** (`src/storage/session.ts`, alarms): a session snapshots a site
list and runs focus/rest phases via `chrome.alarms`. During focus, the
snapshot list is blocked on top of the rules, unlocks are ignored, and the
popup toggle is locked.

**Dashboard integration**: the companion site manages rules through the
`onMessageExternal` API (`externally_connectable`), which exposes CRUD for
rules, site lists, unlocks, history, settings, and Pomodoro sessions.

## Permissions

| Permission                                  | Why it is needed                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `storage`                                   | Save rules, site lists, settings, block history, and the Pomodoro session locally (`chrome.storage.local` / `.session`).                                                       |
| `alarms`                                    | Drive Pomodoro focus/rest phase transitions, including after the browser restarts.                                                                                             |
| `webNavigation`                             | Observe top-level navigations so blocked sites can be redirected to the block page.                                                                                            |
| `tabs`                                      | Redirect the blocked tab to the block page; open the dashboard in a tab on first install.                                                                                      |
| Host access (`https://*/*`)                 | Observe navigations to every https site so blocking works everywhere the user browses. Only sites listed in rules, the Pomodoro list, or the bundled list are ever redirected. |
| `externally_connectable` (dashboard origin) | Let the companion dashboard read/update rules and start Pomodoro sessions. Omitted from builds without `WXT_WEB_URL`.                                                          |

## Privacy

Verified against the code:

- **No accounts, no tracking, no analytics.** The extension makes no network
  requests of its own — no telemetry, no remote config.
- **All personal data stays on your device** in `chrome.storage.local` and
  `chrome.storage.session`: your rules, site lists, settings, temporary
  unlocks, block history (last 100 entries), and Pomodoro statistics.
- **Blocking redirects locally.** When a site is blocked, the browser
  navigates to the companion block page
  (`https://quran.pandusudo.xyz/blocked?...`) with the blocked URL as a query
  parameter. That navigation is performed by the browser to the dashboard
  origin; the extension does not upload your browsing data anywhere else.
- **The dashboard can talk to the extension** (rules CRUD, Pomodoro control)
  only from the configured origin. It cannot read pages or browsing history
  beyond what the extension's own message API returns.
- The bundled block list is static, compiled into the package; it is not
  downloaded at runtime and cannot phone home.

See [PRIVACY.md](PRIVACY.md) for the full policy (also suitable for the
Chrome Web Store listing).

## Block list and credits

The always-block list is compiled from community hosts files —
[StevenBlack/hosts](https://github.com/StevenBlack/hosts),
[hostsVN](https://github.com/bigdargon/hostsVN),
[Clefspeare13/pornhosts](https://github.com/Clefspeare13/pornhosts), and
others — and is bundled inside the extension. Full licenses, attributions,
and provenance: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Roadmap / ideas

- Migrate interception to `declarativeNetRequest` for a lighter service worker
- First-class schedule editing UI in the popup (currently dashboard-only)
- Firefox build via WXT
- Open-source the companion dashboard
- Per-rule stats and weekly focus reports

Ideas, not commitments — contributions welcome.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).

Please report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[GPL-3.0](LICENSE) © Pandu Cahyo Pangestu. Third-party block-list data and
any quoted translations remain under their own terms — see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Acknowledgments

- [Steven Black](https://github.com/StevenBlack) and contributors of the
  unified hosts project
- [BigDargon / hostsVN](https://github.com/bigdargon/hostsVN)
- [Clefspeare13/pornhosts](https://github.com/Clefspeare13/pornhosts)
  contributors, especially [@Spirillen](https://www.mypdns.org/p/Spirillen/)
  and Niclas ([@Clefspeare13](https://github.com/Clefspeare13))
- Everyone fighting their own ghaflah — may Allah accept your effort

## Contact

- Bugs and features: [GitHub Issues](https://github.com/pandusudo/quran-discipline/issues)
- Author: [Pandu Cahyo Pangestu](https://github.com/pandusudo)

[Bahasa Indonesia](README.id.md)
