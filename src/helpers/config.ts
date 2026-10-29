/**
 * Origin of the companion dashboard / block page, set at build time from
 * `WXT_WEB_URL` (see `.env.example`). Official and release builds set it to
 * the production dashboard; when unset (e.g. a bare local build), the
 * extension falls back to the production origin so blocking still works.
 */
const dashboardOrigin = (
  import.meta.env.WXT_WEB_URL ?? "https://quran.pandusudo.xyz"
).replace(/\/+$/, "");

/** The URL users are redirected to when a blocked site is detected. */
export const BLOCK_REDIRECT_URL = dashboardOrigin;

/** The web dashboard opened from the popup's cog button. */
export const DASHBOARD_URL = `${dashboardOrigin}/dashboard`;
