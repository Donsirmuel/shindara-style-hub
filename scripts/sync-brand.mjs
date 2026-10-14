/**
 * Syncs index.html title/meta from src/site.config.ts.
 * Runs automatically before dev/build (see package.json predev/prebuild),
 * so a fork's browser tab and link previews follow the config with no
 * hand-editing. index.html is generated output — don't edit it by hand.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function field(name, fallback = "") {
  const src = fs.readFileSync(path.join(root, "src/site.config.ts"), "utf8");
  const m = src.match(new RegExp(`${name}:\\s*"([^"]+)"`));
  return m ? m[1] : fallback;
}

const brand = field("brand", "Store");
const tagline = field("tagline", "");
const description = field("description", tagline);

const title = `${brand} | ${tagline}`;
const replacements = [
  [/<title>.*?<\/title>/, `<title>${title}</title>`],
  [/(<meta name="description" content=")[^"]*(" \/>)/, `$1${description}$2`],
  [/(<meta name="author" content=")[^"]*(" \/>)/, `$1${brand}$2`],
  [/(<meta property="og:title" content=")[^"]*(" \/>)/, `$1${title}$2`],
  [/(<meta property="og:description" content=")[^"]*(" \/>)/, `$1${description}$2`],
  [/(<meta name="twitter:title" content=")[^"]*(" \/>)/, `$1${title}$2`],
  [/(<meta name="twitter:description" content=")[^"]*(" \/>)/, `$1${description}$2`],
];

const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");
let changed = false;
for (const [pattern, replacement] of replacements) {
  const next = html.replace(pattern, replacement);
  if (next !== html) {
    changed = true;
    html = next;
  }
}
if (changed) {
  fs.writeFileSync(file, html);
  console.log(`brand synced to index.html: ${title}`);
} else {
  console.log("index.html already in sync with site.config.ts");
}
