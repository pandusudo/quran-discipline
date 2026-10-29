import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

/**
 * Origin of the companion dashboard / block page, from `.env`
 * (see `.env.example`). Absent in local builds, in which case the
 * `externally_connectable` manifest entry is omitted entirely.
 *
 * Read directly from `.env` because WXT's config loader evaluates this file
 * before its own env files are applied to `import.meta.env`.
 */
const readDashboardOrigin = (): string | undefined => {
  const fromProcess = process.env.WXT_WEB_URL;
  if (fromProcess) return fromProcess;

  const envPath = new URL(".env", import.meta.url);
  if (!existsSync(envPath)) return undefined;
  try {
    return parseEnv(readFileSync(envPath, "utf8")).WXT_WEB_URL || undefined;
  } catch {
    return undefined;
  }
};

const dashboardOrigin = readDashboardOrigin();

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  vite: () => ({
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
  }),
  webExt: {
    disabled: true,
  },
  manifest: () => ({
    name: "Quran Discipline",
    icons: {
      16: "icon16.png",
      32: "icon32.png",
      48: "icon48.png",
      128: "icon128.png",
    },
    action: {
      default_icon: {
        16: "icon16.png",
        32: "icon32.png",
        48: "icon48.png",
        128: "icon128.png",
      },
    },
    description:
      "Beat social media addiction with Quran Discipline and block distracting sites and stay focused with Quranic reminders.",
    version: "1.6.0",
    // storage — block rules, site lists, settings, history, Pomodoro session
    // alarms — Pomodoro focus/rest phase timers
    // webNavigation — intercept top-level navigations to redirect blocked sites
    // tabs — open the dashboard on install; redirect blocked tabs to the block page
    permissions: ["storage", "alarms", "webNavigation", "tabs"],
    // Broad host access so webNavigation events are observed for every https
    // site the user visits — blocking only ever matches user-defined rules,
    // the Pomodoro list, or the bundled always-block list.
    host_permissions: ["https://*/*"],
    // The companion dashboard (block page + rule management UI) may call
    // runtime.sendMessage on this extension. Only present when WXT_WEB_URL is
    // set (see .env.example) so local builds don't emit an invalid origin.
    ...(dashboardOrigin
      ? { externally_connectable: { matches: [`${dashboardOrigin}/*`] } }
      : {}),
  }),
});
