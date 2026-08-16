import { describe, expect, it, vi } from "vitest";

const invalidApiResponse = vi.hoisted(() => vi.fn(() => { throw new Error("invalid"); }));
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api/http", () => ({ apiRequest, invalidApiResponse }));

import { getExperienceSummary, parseExperienceSummary } from "./getExperienceSummary";

describe("Experience summary API", () => {
  it("strictly parses the public total only", () => {
    expect(parseExperienceSummary({ totalXp: 880 })).toEqual({ totalXp: 880 });
    expect(() => parseExperienceSummary({ totalXp: "880" })).toThrow("invalid");
  });

  it("requests the authenticated summary endpoint", async () => {
    apiRequest.mockResolvedValue({ totalXp: 880 });

    await expect(getExperienceSummary("token")).resolves.toEqual({ totalXp: 880 });
    expect(apiRequest).toHaveBeenCalledWith("/experience/summary", {
      signal: undefined,
      token: "token",
    });
  });
});
