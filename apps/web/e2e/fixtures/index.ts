/**
 * Shared Playwright test entry for browser E2E.
 * Extend here when adding fixtures (e.g. authenticatedPage, seededCollection).
 *
 * @example
 * import { test as base } from "@playwright/test";
 * export const test = base.extend<{ authenticatedPage: Page }>({ ... });
 */
import { test as base, expect } from "@playwright/test";

export const test = base;
export { expect };
