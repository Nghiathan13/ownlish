import { describe, expect, it, vi } from "vitest";

vi.mock("@/_pages/tests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/tests")>()),
  PracticeSessionRoutePage: () => <div />,
}));

import ReviewWrongPage from "./page";

describe("ReviewWrongPage", () => {
  it("passes review_wrong mode and session params to the route page", () => {
    const params = Promise.resolve({ sessionId: "session-1" });
    const page = ReviewWrongPage({ params });

    expect(page.props).toMatchObject({ mode: "review_wrong", params });
  });
});
