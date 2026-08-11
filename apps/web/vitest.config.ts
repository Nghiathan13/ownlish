import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
      reporter: ["text", "json-summary", "lcov", "html"],
      reportsDirectory: "./coverage",
    },
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: ["src/**/*.test.ts", "app/**/*.test.ts", "scripts/**/*.test.mjs"],
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
          include: ["src/**/*.test.tsx", "app/**/*.test.tsx"],
          name: "component",
          setupFiles: ["./src/shared/lib/testing/setupComponentTests.ts"],
        },
      },
    ],
  },
});
