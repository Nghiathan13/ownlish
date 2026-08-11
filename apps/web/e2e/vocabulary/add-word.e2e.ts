import { LoginPage } from "../pages/LoginPage";
import { UserVocabularyPage } from "../pages/UserVocabularyPage";
import { expect, test } from "../fixtures";
import { E2E_DEFAULT_USER_NAME } from "../helpers/env";
import { createRunIdentity } from "../helpers/identity";

/**
 * Vocabulary journey (authenticated): open personal collection and add a word.
 * Signup is only setup — auth assertions live under e2e/auth/.
 */
test("adds a word to personal vocabulary after signup", async ({ page }) => {
  const { email, word } = createRunIdentity();
  const login = new LoginPage(page);
  const vocabulary = new UserVocabularyPage(page);

  await test.step("sign up to reach user collections", async () => {
    await page.goto("/collections/user");
    await login.expectRedirectFromProtected("/collections/user");
    await login.signUpWithEmailOtp(email, E2E_DEFAULT_USER_NAME);
    await expect(page).toHaveURL((url) => url.pathname === "/collections/user");
  });

  await test.step("open My Vocabulary and create an entry", async () => {
    await vocabulary.openMyVocabulary();
    await vocabulary.addWord(word, "Từ được tạo bởi Playwright");
    await vocabulary.searchAndExpectWord(word);
  });
});
