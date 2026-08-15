import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SOURCE_ROOTS = ["src", "app"];
const SOURCE_FILE_PATTERN = /\.(?:ts|tsx)$/;
const TEST_FILE_PATTERN = /\.(?:test|spec)\.(?:ts|tsx)$/;
const COLOR_PATTERN = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)|\b(?:bg|text|border|fill|stroke|ring|outline|accent)-(?:red|emerald|amber|sky|neutral|black|white)(?:-\d{2,3})?(?:\/\d+)?/gi;

const allowedTokensByFile = new Map([
  [
    "src/_pages/dictation/ui/study/DictationStudy.tsx",
    new Set([
      "bg-black/50",
      "text-white",
      "bg-white/30",
      "bg-white",
      "rgb(0_0_0)",
      "rgb(255_255_255)",
      "rgb(255 255 255 / 0.3)",
      "rgb(255 255 255 / 0.7)",
    ]),
  ],
  // Native-video fallback needs fixed contrast.
  [
    "src/_pages/dictation/ui/study/YouTubeSegmentPlayer.tsx",
    new Set(["bg-black"]),
  ],
  // Intentional landing-page artwork uses its own visual treatment.
  [
    "src/_pages/landing/ui/GuestLanding.tsx",
    new Set([
      "#1418a8",
      "#000",
      "text-white",
      "text-white/80",
      "rgba(255, 255, 255, 0.32)",
      "rgba(0,0,0,0.35)",
    ]),
  ],
  // The donut uses black only as an alpha-mask paint, never as visible UI color.
  [
    "src/features/dashboard-progress/lib/reviewProgressDonut.ts",
    new Set(["#000"]),
  ],
  // The login background is a local decorative illustration.
  [
    "src/_pages/login/ui/LoginPage.tsx",
    new Set([
      "rgb(2, 8, 13)",
      "rgb(25, 29, 193)",
      "rgb(41, 126, 232)",
      "rgb(234, 239, 252)",
    ]),
  ],
  // Official social-network brand marks retain their provider-defined colors.
  [
    "src/shared/ui/icons/FacebookIcon.tsx",
    new Set(["#0866ff", "#fff"]),
  ],
  [
    "src/shared/ui/icons/TikTokIcon.tsx",
    new Set(["#25f4ee", "#fe2c55", "#fff", "#000"]),
  ],
  [
    "src/shared/ui/icons/YouTubeIcon.tsx",
    new Set(["#fff"]),
  ],
]);

function normalizeToken(token) {
  return token.toLowerCase();
}

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    return SOURCE_FILE_PATTERN.test(entry.name) && !TEST_FILE_PATTERN.test(entry.name)
      ? [entryPath]
      : [];
  });
}

export function findDisallowedColors(source, relativePath) {
  const allowedTokens = allowedTokensByFile.get(relativePath) ?? new Set();

  return [...source.matchAll(COLOR_PATTERN)]
    .map((match) => normalizeToken(match[0]))
    .filter((token) => !allowedTokens.has(token));
}

export function findColorViolations(rootDirectory = WEB_ROOT) {
  return SOURCE_ROOTS.flatMap((sourceRoot) => {
    const rootPath = join(rootDirectory, sourceRoot);

    return collectSourceFiles(rootPath).flatMap((filePath) => {
      const relativePath = relative(rootDirectory, filePath);
      const source = readFileSync(filePath, "utf8");

      return findDisallowedColors(source, relativePath).map((token) => ({
        relativePath,
        token,
      }));
    });
  });
}

function main() {
  const violations = findColorViolations();

  if (violations.length === 0) {
    return;
  }

  const details = violations
    .map(({ relativePath, token }) => `- ${relativePath}: ${token}`)
    .join("\n");

  throw new Error(
    `Use semantic Tailwind color tokens instead of raw UI colors:\n${details}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
