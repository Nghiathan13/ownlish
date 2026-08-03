/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const { chromium } = require("@playwright/test");

const playwrightChromePath = chromium.executablePath();
const defaultUrls = ["http://localhost:3100/", "http://localhost:3100/login"];
const chromeFlags = ["--no-sandbox", "--disable-dev-shm-usage"];

module.exports = ({ outputDir, settings, urls = defaultUrls, puppeteerScript }) => ({
  ci: {
    collect: {
      startServerCommand: "./node_modules/.bin/next start --port 3100",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 60_000,
      url: urls,
      numberOfRuns: 3,
      chromePath: fs.existsSync(playwrightChromePath)
        ? playwrightChromePath
        : undefined,
      ...(puppeteerScript
        ? {
            puppeteerScript,
            puppeteerLaunchOptions: {
              ...(fs.existsSync(playwrightChromePath)
                ? { executablePath: playwrightChromePath }
                : {}),
              args: chromeFlags,
            },
          }
        : {}),
      settings: {
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        ...(puppeteerScript ? {} : { chromeFlags: chromeFlags.join(" ") }),
        maxWaitForLoad: 30_000,
        ...settings,
      },
    },
    upload: {
      target: "filesystem",
      outputDir,
    },
  },
});
