/* eslint-disable @typescript-eslint/no-require-imports */

const createLighthouseConfig = require("./lighthouse.config.cjs");

const FIXTURE_COLLECTION_ID = "20000000-0000-4000-8000-000000000001";
const urls = [
  "http://localhost:3100/",
  "http://localhost:3100/collections/user",
  `http://localhost:3100/collections/user/${FIXTURE_COLLECTION_ID}`,
  "http://localhost:3100/collections/oxford/A1",
  "http://localhost:3100/collections/oxford/A1/part-1",
  "http://localhost:3100/review",
  "http://localhost:3100/review/oxford/A1/part-1",
  "http://localhost:3100/tests?tab=mock_tests&year=2019",
  "http://localhost:3100/tests?tab=part_practice&part=1",
  "http://localhost:3100/dictation",
  "http://localhost:3100/dictation/music",
  "http://localhost:3100/dictation/bbc",
];

module.exports = createLighthouseConfig({
  outputDir: ".lighthouseci-authenticated",
  urls,
  puppeteerScript: "scripts/lighthouse/authenticate.cjs",
  settings: { formFactor: "mobile" },
});
