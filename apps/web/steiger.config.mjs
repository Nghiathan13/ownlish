import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // FSD requires _app and _pages in Next.js projects to avoid router conflicts.
    rules: {
      "fsd/typo-in-layer-name": "off",
      // Dashboard activity/progress are intentionally page-scoped feature slices:
      // large enough to own ui/model/lib, but only composed by dashboard pages.
      "fsd/insignificant-slice": "off",
    },
  },
]);

