/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const { chromium } = require("@playwright/test");

const playwrightChromePath = chromium.executablePath();

module.exports = {
  ci: {
    collect: {
      startServerCommand: "./node_modules/.bin/next start --port 3100",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 60_000,
      url: ["http://localhost:3100/", "http://localhost:3100/login"],
      numberOfRuns: 3,
      chromePath: fs.existsSync(playwrightChromePath)
        ? playwrightChromePath
        : undefined,
      settings: {
        formFactor: "mobile",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        maxWaitForLoad: 30_000,
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
