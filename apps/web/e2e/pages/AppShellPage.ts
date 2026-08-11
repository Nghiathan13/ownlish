import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";

/**
 * Application chrome: mobile menu + user menu (logout).
 */
export class AppShellPage {
  constructor(private readonly page: Page) {}

  async openUserMenu(displayName: string) {
    if (test.info().project.name === "chromium-mobile") {
      await this.page.getByRole("button", { name: "Open menu" }).click();
    }
    await this.page
      .getByRole("button", { name: displayName, exact: true })
      .click();
  }

  async logout(displayName: string) {
    await this.openUserMenu(displayName);
    const logoutResponse = this.page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/logout") &&
        response.request().method() === "POST",
    );
    await this.page.getByRole("menuitem", { name: "Logout" }).click();
    expect((await logoutResponse).status()).toBe(201);
  }
}
