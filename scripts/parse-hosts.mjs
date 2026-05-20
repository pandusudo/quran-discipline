import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getDomain } from "tldts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const hostsPath = resolve(__dirname, "./hosts.txt");
const outputPath = resolve(__dirname, "../src/data/blocked-hosts.json");

const lines = readFileSync(hostsPath, "utf-8").split("\n");

const rootDomains = new Set();

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) continue;

  const host = parts[1].toLowerCase();

  if (host === "localhost" || host === "0.0.0.0" || host === "broadcasthost")
    continue;

  const root = getDomain(host);
  if (!root) continue;

  rootDomains.add(root);
}

const hash = Object.fromEntries(Array.from(rootDomains).map((d) => [d, 1]));

writeFileSync(outputPath, JSON.stringify(hash));

console.log(
  `✅ Saved ${rootDomains.size} unique root domains to ${outputPath}`,
);
