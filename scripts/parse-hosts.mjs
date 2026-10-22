import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parse } from "tldts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const hostsPath = resolve(__dirname, "./hosts.txt");
const pathsPath = resolve(__dirname, "./blocked-paths.txt");
const hostsOutPath = resolve(__dirname, "../src/data/blocked-hosts.json");
const pathsOutPath = resolve(__dirname, "../src/data/blocked-paths.json");

const EXTRA_PLATFORM_SUFFIXES = [
  // Static / app hosting
  "vercel.app",
  "now.sh",
  "netlify.app",
  "netlify.com",
  "pages.dev",
  "workers.dev",
  "github.io",
  "githubusercontent.com",
  "gitlab.io",
  "bitbucket.io",
  "codeberg.page",
  "surge.sh",
  "onrender.com",
  "fly.dev",
  "railway.app",
  "up.railway.app",
  "herokuapp.com",
  "herokussl.com",
  "web.app",
  "firebaseapp.com",
  "appspot.com",
  "run.app",
  "cloudfunctions.net",
  "azurewebsites.net",
  "azurestaticapps.net",
  "blob.core.windows.net",
  "cloudfront.net",
  "s3.amazonaws.com",
  "amazonaws.com",
  "elasticbeanstalk.com",
  "glitch.me",
  "repl.co",
  "replit.app",
  "replit.dev",
  "stackblitz.io",
  "codesandbox.io",
  "csb.app",
  "val.run",
  "deno.dev",
  "deno.net",
  "streamlit.app",
  "hf.space",
  "gradio.live",
  "pythonanywhere.com",
  "ngrok.io",
  "ngrok.app",
  "ngrok-free.app",
  "ngrok-free.dev",
  "trycloudflare.com",
  "loca.lt",
  "serveo.net",
  "localtunnel.me",
  "lovable.app",
  "lovable.dev",
  "bolt.host",
  "v0.dev",
  "framer.app",
  "framer.website",
  "framer.ai",
  "webflow.io",
  "wixsite.com",
  "wixstudio.io",
  "weebly.com",
  "squarespace.com",
  "myshopify.com",
  "carrd.co",
  "typedream.app",
  "super.site",
  "notion.site",
  "tiiny.site",
  "neocities.org",
  "gitbook.io",
  "readthedocs.io",
  "mystrikingly.com",
  "jimdosite.com",
  "godaddysites.com",
  "my.canva.site",
  "canva.site",
  "durable.co",
  "hostinger.site",
  "000webhostapp.com",
  "infinityfreeapp.com",
  "epizy.com",
  "rf.gd",
  "byethost.com",
  "wasmer.app",
  "edgeone.app",
  "zeabur.app",
  "koyeb.app",
  "northflank.app",
  "leapcell.dev",
  // Blog / content platforms
  "blogspot.com",
  "blogspot.co.id",
  "wordpress.com",
  "tumblr.com",
  "substack.com",
  "medium.com",
  "beehiiv.com",
  "ghost.io",
  "hashnode.dev",
  "dev.to",
  "livejournal.com",
  "typepad.com",
  "over-blog.com",
  "fandom.com",
  "wikia.com",
  "bsky.social",
  "mastodon.social",
  "itch.io",
  "newgrounds.com",
  "deviantart.com",
  "bandcamp.com",
  "podbean.com",
  "wix.com",
  "webnode.com",
  "site123.me",
  "yolasite.com",
  "zyrosite.com",
  "sites.google.com",
  "livejournal.com",
  "teachable.com",
  "thinkific.com",
  "kajabi.com",
  "gumroad.com",
  "ko-fi.com",
  "linktr.ee",
  "bio.link",
  "taplink.cc",
]
  .filter((v, i, a) => a.indexOf(v) === i)
  // terpanjang dulu, supaya "s3.amazonaws.com" menang atas "amazonaws.com"
  .sort((a, b) => b.length - a.length);

const PATH_SCOPED_DOMAINS = new Set(["reddit.com"]);

const IGNORED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "local",
  "0.0.0.0",
  "broadcasthost",
  "ip6-localhost",
  "ip6-loopback",
]);

/** Hasilkan key blok untuk sebuah hostname. */
function getBlockKey(host) {
  // 1) platform manual: simpan sampai level subdomain user
  for (const suffix of EXTRA_PLATFORM_SUFFIXES) {
    if (host === suffix) return host;
    if (host.endsWith("." + suffix)) {
      const rest = host.slice(0, -(suffix.length + 1));
      const label = rest.split(".").pop();
      return label === "www" ? suffix : `${label}.${suffix}`;
    }
  }

  // 2) PSL (termasuk private section): foo.vercel.app -> foo.vercel.app
  //    Kalau host-nya sendiri adalah public suffix (mis. "vercel.app"),
  //    domain = null dan di-skip, supaya tidak memblokir semua user platform.
  const { domain } = parse(host, { allowPrivateDomains: true });
  return domain;
}

// ---------- 1. hosts.txt -> blocked-hosts.json ----------
const rootDomains = new Set();
let skippedPathScoped = 0;
let skippedSuffix = 0;

for (const line of readFileSync(hostsPath, "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) continue;

  const host = parts[1].toLowerCase();
  if (IGNORED_HOSTS.has(host)) continue;

  const key = getBlockKey(host);
  if (!key) {
    skippedSuffix++;
    continue;
  }

  if (PATH_SCOPED_DOMAINS.has(key)) {
    skippedPathScoped++;
    continue;
  }

  rootDomains.add(key);
}

writeFileSync(
  hostsOutPath,
  JSON.stringify(Object.fromEntries([...rootDomains].map((d) => [d, 1]))),
);

const pathMap = {};
let pathCount = 0;

if (existsSync(pathsPath)) {
  for (const line of readFileSync(pathsPath, "utf-8").split("\n")) {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const noProto = trimmed.replace(/^https?:\/\//, "");
    const slash = noProto.indexOf("/");
    if (slash === -1) continue; // tanpa path = bukan entri path

    const key = getBlockKey(noProto.slice(0, slash));
    if (!key) continue;

    const path = noProto
      .slice(slash)
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
    if (!path) continue;

    (pathMap[key] ??= {})[path] = 1;
    pathCount++;
  }
}

writeFileSync(pathsOutPath, JSON.stringify(pathMap));

console.log(`✅ ${rootDomains.size} blocked hosts -> ${hostsOutPath}`);
console.log(
  `✅ ${pathCount} path rules (${Object.keys(pathMap).length} domains) -> ${pathsOutPath}`,
);
console.log(
  `ℹ️  skipped: ${skippedPathScoped} path-scoped host, ${skippedSuffix} bare public suffix`,
);
