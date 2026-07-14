import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: ["src/**/*.test.ts"],
          name: "unit",
        },
      },
      {
        extends: true,
        test: {
          environment: "jsdom",
          environmentOptions: {
            jsdom: {
              url: "http://localhost:3000",
            },
          },
          include: ["src/**/*.test.tsx"],
          name: "component",
          setupFiles: ["./src/shared/lib/testing/setupComponentTests.ts"],
        },
      },
    ],
  },
});
