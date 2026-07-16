import { randomUUID } from "node:crypto";
import { expect, request, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:3101";
const E2E_USER_NAME = "E2E User";
const E2E_USER_PASSWORD = "playwright-test-password";

test("persists a protected vocabulary session and clears it on logout", async ({
  context,
  page,
}) => {
  const runId = randomUUID().slice(0, 8);
  const email = `playwright-${runId}@example.com`;
  const word = `e2e-${runId}`;
  const setupApi = await request.newContext({ baseURL: API_BASE_URL });

  try {
    const registerResponse = await setupApi.post("/auth/register", {
      data: {
        email,
        name: E2E_USER_NAME,
        password: E2E_USER_PASSWORD,
      },
    });

    expect(registerResponse.status()).toBe(201);
    expect((await setupApi.post("/auth/logout")).status()).toBe(201);
  } finally {
    await setupApi.dispose();
  }

  await page.goto("/collections?tab=user");
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/login" &&
      url.searchParams.get("redirect") === "/collections?tab=user",
  );

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/collections" &&
      url.searchParams.get("tab") === "user",
  );

  const refreshCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "engvocab.refreshToken",
  );
  expect(refreshCookie).toMatchObject({
    httpOnly: true,
    path: "/api/auth",
    sameSite: "Lax",
    secure: true,
  });

  await page
    .getByRole("link", { name: "Open My Vocabulary", exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      /^\/collections\/[0-9a-f-]+$/.test(url.pathname) &&
      url.searchParams.get("kind") === "user",
  );

  const collectionUrl = page.url();
  await page
    .getByRole("button", { name: "Add word", exact: true })
    .click();

  const addWordDialog = page.getByRole("dialog", { name: "Add word" });
  await expect(addWordDialog).toBeVisible();
  await addWordDialog.getByLabel("Word", { exact: true }).fill(word);
  await addWordDialog
    .getByLabel("Vietnamese meaning", { exact: true })
    .fill("Từ được tạo bởi Playwright");

  const createWordResponse = page.waitForResponse(
    (response) =>
      response.url() === `${API_BASE_URL}/vocab` &&
      response.request().method() === "POST",
  );
  await addWordDialog
    .getByRole("button", { name: "Add word", exact: true })
    .click();
  expect((await createWordResponse).status()).toBe(201);
  await expect(addWordDialog).toBeHidden();

  await page.getByLabel("Search the word").fill(word);
  await expect(
    page.getByRole("cell", { name: word, exact: true }),
  ).toBeVisible();

  const refreshResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/refresh") &&
      response.request().method() === "POST",
  );
  await page.reload();
  expect((await refreshResponse).status()).toBe(201);
  await expect(page).toHaveURL(collectionUrl);

  await page.getByLabel("Search the word").fill(word);
  await expect(
    page.getByRole("cell", { name: word, exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: E2E_USER_NAME, exact: true })
    .click();
  const logoutResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/logout") &&
      response.request().method() === "POST",
  );
  await page.getByRole("menuitem", { name: "Logout" }).click();
  expect((await logoutResponse).status()).toBe(201);

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/login" &&
      url.searchParams.get("redirect") === new URL(collectionUrl).pathname +
        new URL(collectionUrl).search,
  );
  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === "engvocab.refreshToken",
    ),
  ).toBeUndefined();

  await page.goto("/collections?tab=user");
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/login" &&
      url.searchParams.get("redirect") === "/collections?tab=user",
  );
});
