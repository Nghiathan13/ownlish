import { describe, expect, it, vi } from "vitest";

vi.mock("@/_pages/tests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/tests")>()),
  MockSessionRoutePage: ({
    params,
  }: {
    params?: Promise<{ sessionId: string }>;
  }) => <div data-params={params ? "ok" : ""} />,
}));

import MockTestPage from "./page";

describe("MockTestPage", () => {
  it("passes session params to the mock session route page", () => {
    const params = Promise.resolve({ sessionId: "session-1" });
    const page = MockTestPage({ params });

    expect(page.props).toMatchObject({ params });
  });
});
