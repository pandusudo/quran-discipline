import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

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
    version: "1.6",
    permissions: ["storage", "alarms", "webNavigation", "tabs"],
    host_permissions: ["https://*/*"],
    externally_connectable: {
      matches: [`${import.meta.env.WXT_WEB_URL}/*`],
    },
  }),
});
