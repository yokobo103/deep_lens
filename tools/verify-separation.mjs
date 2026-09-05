import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const denylistedPaths = [
  "src/app", "src/missions", "src/why-here", "src/share", "src/i18n", "src/hooks", "src/observations",
  "src/lenses", "src/globe/EarthGlobe.tsx", "src/components/AboutSplash.tsx", "src/components/aboutSplashState.ts",
  "src/components/AnchoredDetailsCard.tsx", "src/components/DetailsPanel.tsx", "src/components/LanguageSelector.tsx",
  "src/components/LayerPanel.tsx", "src/components/LifeMarker.tsx", "src/components/ModeSelector.tsx",
  "src/components/ShareButton.tsx", "src/components/Timeline.tsx", "src/components/WhyHerePanel.tsx",
  "src/components/mission", "src/data/demo", "public/og-earth-lens.jpg",
  // `src/assets` as a whole was denylisted while it could only mean EARTH LENS's
  // stickers and splash. Deep Lens now keeps its own icon set there, so the
  // inherited files are named directly instead of the folder that holds them.
  "src/assets/stickers", "src/assets/about-splash.webp",
  "tools/build-geo.mjs", "tools/verify-borders.mjs", "tools/check-external-links.mjs",
  "tools/mobile-layout-audit.mjs", "tools/build-stickers.py",
];
// `.github/workflows/deploy.yml` was on this list while Deep Lens had no
// deployment of its own. It now has one, written for this repo, so the path is
// no longer a signal of inheritance — the forbidden-text check below is what
// catches an EARTH LENS workflow if one is ever copied back in.
const forbiddenImports = /(?:missions|lenses|why-here|i18n|share)\//;
const forbiddenText = ["EARTH LENS", "earth-lens", "Earth Lens"];
const failures = [];

for (const path of denylistedPaths) {
  if (existsSync(join(root, path))) failures.push(`denylisted path exists: ${path}`);
}

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

for (const path of sourceFiles(join(root, "src"))) {
  const content = readFileSync(path, "utf8");
  if (forbiddenImports.test(content)) failures.push(`forbidden import in ${relative(root, path)}`);
}

for (const path of ["src", "index.html", "package.json", "README.md"]) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) continue;
  const paths = path === "src" ? sourceFiles(absolutePath) : [absolutePath];
  for (const file of paths) {
    const content = readFileSync(file, "utf8");
    for (const text of forbiddenText) {
      if (content.includes(text)) failures.push(`forbidden text "${text}" in ${relative(root, file)}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Deep Lens separation verification passed.");
