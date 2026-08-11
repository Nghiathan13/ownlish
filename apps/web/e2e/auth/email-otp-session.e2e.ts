import type { BrowserContext } from "@playwright/test";
import { AppShellPage } from "../pages/AppShellPage";
import { LoginPage } from "../pages/LoginPage";
import { expect, test } from "../fixtures";
import { E2E_DEFAULT_USER_NAME, REFRESH_TOKEN_COOKIE } from "../helpers/env";
import { createRunIdentity } from "../helpers/identity";

const protectedPath = "/collections/user";

async function expectRefreshCookie(context: BrowserContext) {
  const refreshCookie = (await context.cookies()).find(
    (cookie) => cookie.name === REFRESH_TOKEN_COOKIE,
  );

  expect(refreshCookie).toMatchObject({
    httpOnly: true,
    path: "/api/auth",
    sameSite: "Lax",
  });
}

async function expectNoRefreshCookie(context: BrowserContext) {
  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === REFRESH_TOKEN_COOKIE,
    ),
  ).toBeUndefined();
}

test("new user completes the email OTP profile flow", async ({
  context,
  page,
}) => {
  const { email } = createRunIdentity();
  const login = new LoginPage(page);

  await page.goto(protectedPath);
  await login.expectRedirectFromProtected(protectedPath);
  await login.signUpWithEmailOtp(email, E2E_DEFAULT_USER_NAME);

  await expect(page).toHaveURL((url) => url.pathname === protectedPath);
  await expectRefreshCookie(context);
});

test("existing user signs in by OTP and reload restores the session", async ({
  context,
  page,
}) => {
  const { email } = createRunIdentity();
  const login = new LoginPage(page);
  const shell = new AppShellPage(page);

  await page.goto(protectedPath);
  await login.signUpWithEmailOtp(email, E2E_DEFAULT_USER_NAME);
  await shell.logout(E2E_DEFAULT_USER_NAME);
  await login.logInExistingWithEmailOtp(email);
  await expect(page).toHaveURL((url) => url.pathname === protectedPath);
  await expectRefreshCookie(context);

  const refreshResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/refresh") &&
      response.request().method() === "POST",
  );
  await page.reload();

  expect((await refreshResponse).status()).toBe(201);
  await expect(page).toHaveURL((url) => url.pathname === protectedPath);
});

test("logout clears the session and blocks protected routes", async ({
  context,
  page,
}) => {
  const { email } = createRunIdentity();
  const login = new LoginPage(page);
  const shell = new AppShellPage(page);

  await page.goto(protectedPath);
  await login.signUpWithEmailOtp(email, E2E_DEFAULT_USER_NAME);
  await shell.logout(E2E_DEFAULT_USER_NAME);

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/login" &&
      url.searchParams.get("redirect") === protectedPath,
  );
  await expectNoRefreshCookie(context);

  await page.goto(protectedPath);
  await login.expectRedirectFromProtected(protectedPath);
});
