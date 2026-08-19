import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/_pages/dictation", () => ({
  DictationStudyPage: ({ videoId }: { videoId: string }) => (
    <div data-video-id={videoId} />
  ),
}));

import DictationWatchRoute from "./page";

describe("DictationWatchRoute", () => {
  it("passes a valid video id to the study page", async () => {
    const page = await DictationWatchRoute({
      searchParams: Promise.resolve({ v: "7BIp53who2A" }),
    });

    expect(page.props).toMatchObject({ videoId: "7BIp53who2A" });
  });

  it("redirects a missing video id to the dictation library", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      DictationWatchRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/dictation");
  });
});
