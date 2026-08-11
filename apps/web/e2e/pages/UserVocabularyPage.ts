import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { E2E_API_BASE_URL } from "../helpers/env";

/**
 * User collections list + personal vocabulary detail (add/search words).
 */
export class UserVocabularyPage {
  constructor(private readonly page: Page) {}

  async openMyVocabulary() {
    await this.page
      .getByRole("link", { name: "Open My Vocabulary", exact: true })
      .click();
    await expect(this.page).toHaveURL(
      (url) => /^\/collections\/user\/[0-9a-f-]+$/.test(url.pathname),
    );
  }

  wordResult(word: string): Locator {
    return test.info().project.name === "chromium-mobile"
      ? this.page.getByRole("heading", { name: word, exact: true })
      : this.page.getByRole("cell", { name: word, exact: true });
  }

  async addWord(word: string, meaning: string) {
    await this.page.getByRole("button", { name: "Add word", exact: true }).click();

    const dialog = this.page.getByRole("dialog", { name: "Add word" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Word", { exact: true }).fill(word);
    await dialog.getByLabel("Vietnamese meaning", { exact: true }).fill(meaning);

    const createWordResponse = this.page.waitForResponse(
      (response) =>
        response.url() === `${E2E_API_BASE_URL}/vocab` &&
        response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Add word", exact: true }).click();
    expect((await createWordResponse).status()).toBe(201);
    await expect(dialog).toBeHidden();
  }

  async searchAndExpectWord(word: string) {
    await this.page.getByLabel("Search the word").fill(word);
    await expect(this.wordResult(word)).toBeVisible();
  }
}
