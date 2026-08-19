import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import DictationPage from "./page";

describe("DictationPage", () => {
  it("redirects to the default category library", () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    expect(() => DictationPage()).toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/dictation/bbc");
  });
});
