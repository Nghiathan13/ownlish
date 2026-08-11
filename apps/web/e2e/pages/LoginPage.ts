import type { Page } from "@playwright/test";
import { expect } from "../fixtures";
import { getLatestLoginCode } from "../helpers/emailOutbox";

/**
 * Passwordless email OTP login / signup surface (`/login`).
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async expectRedirectFromProtected(path: string) {
    await expect(this.page).toHaveURL(
      (url) =>
        url.pathname === "/login" && url.searchParams.get("redirect") === path,
    );
  }

  async submitEmail(email: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      this.page.getByRole("heading", { name: "Verify your email" }),
    ).toBeVisible();
  }

  async submitOtpFromOutbox(email: string) {
    const code = await getLatestLoginCode(email);
    await this.page.getByTestId("auth-otp-code").fill(code);
    await this.page
      .getByRole("button", { name: "Verify code", exact: true })
      .click();
  }

  async completeProfile(name: string) {
    await expect(
      this.page.getByRole("heading", { name: "Finish your profile" }),
    ).toBeVisible();
    await this.page.getByLabel("Name").fill(name);
    await this.page.getByRole("button", { name: "Finish", exact: true }).click();
  }

  /**
   * Full new-user path: email → OTP (outbox) → profile → lands on redirect target.
   */
  async signUpWithEmailOtp(email: string, name: string) {
    await this.submitEmail(email);
    await this.submitOtpFromOutbox(email);
    await this.completeProfile(name);
  }

  /**
   * Returning user: email → OTP → session (must not show Finish profile).
   */
  async logInExistingWithEmailOtp(email: string) {
    await this.submitEmail(email);
    await this.submitOtpFromOutbox(email);
    await expect(
      this.page.getByRole("heading", { name: "Finish your profile" }),
    ).toBeHidden();
  }
}
