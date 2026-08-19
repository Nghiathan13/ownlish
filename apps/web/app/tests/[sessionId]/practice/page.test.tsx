import { describe, expect, it, vi } from "vitest";

vi.mock("@/_pages/tests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/tests")>()),
  PracticeSessionRoutePage: () => <div />,
}));

import PracticePage from "./page";

describe("PracticePage", () => {
  it("passes practice mode and session params to the route page", () => {
    const params = Promise.resolve({ sessionId: "session-1" });
    const page = PracticePage({ params });

    expect(page.props).toMatchObject({ mode: "practice", params });
  });
});
