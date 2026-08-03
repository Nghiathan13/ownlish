const email = process.env.LIGHTHOUSE_AUTH_EMAIL;
const password = process.env.LIGHTHOUSE_AUTH_PASSWORD;

module.exports = async (browser, { url }) => {
  if (!email || !password) {
    throw new Error(
      "LIGHTHOUSE_AUTH_EMAIL and LIGHTHOUSE_AUTH_PASSWORD must be set.",
    );
  }

  const page = await browser.newPage();

  try {
    await page.goto(new URL(url).origin, { waitUntil: "domcontentloaded" });
    const result = await page.evaluate(
      async ({ email: userEmail, password: userPassword }) => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: userEmail, password: userPassword }),
          credentials: "include",
        });

        return { ok: response.ok, status: response.status };
      },
      { email, password },
    );

    if (!result.ok) {
      throw new Error(`Lighthouse fixture login failed with ${result.status}.`);
    }
  } finally {
    await page.close();
  }
};
