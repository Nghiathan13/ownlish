import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // FSD requires _app and _pages in Next.js projects to avoid router conflicts.
    rules: {
      "fsd/typo-in-layer-name": "off",
    },
  },
]);
