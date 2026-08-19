import { describe, expect, it, vi } from "vitest";

vi.mock("@/_pages/tests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/tests")>()),
  PartPracticeSessionRoutePage: () => <div />,
}));

import PartPracticeRunPage from "./page";

describe("PartPracticeRunPage", () => {
  it("passes session params to the part practice session route page", () => {
    const params = Promise.resolve({ sessionId: "session-1" });
    const page = PartPracticeRunPage({ params });

    expect(page.props).toMatchObject({ params });
  });
});
