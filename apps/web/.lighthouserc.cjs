/* eslint-disable @typescript-eslint/no-require-imports */

const createLighthouseConfig = require("./scripts/lighthouse/create-config.cjs");

module.exports = createLighthouseConfig({
  outputDir: ".lighthouseci",
  settings: { formFactor: "mobile" },
});
