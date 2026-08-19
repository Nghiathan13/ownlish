import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { getDictationProgressQueryKey } from "./queries";
import {
  DICTATION_PROGRESS_STALE_TIME,
  getDictationProgressQueryOptions,
  setDictationProgressQueryData,
} from "./progressQuery";
import type { DictationProgress } from "./types";

const getDictationProgress = vi.hoisted(() => vi.fn());
const runAuthenticatedRequest = vi.hoisted(() =>
  vi.fn(({ request }: { request: (token: string) => unknown }) => request("token")),
);

vi.mock("../api/progress", () => ({ getDictationProgress }));
vi.mock("@/entities/session/@x/dictation-study", () => ({
  runAuthenticatedRequest,
}));

const progress: DictationProgress = {
  videoId: "video-1",
  answeredSegmentIds: ["s001"],
  correctCount: 1,
  completedAt: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("dictation progress query helpers", () => {
  it("uses a shared query key and does not refetch on focus", () => {
    const options = getDictationProgressQueryOptions("user-1", "video-1");

    expect(options.queryKey).toEqual(getDictationProgressQueryKey("user-1", "video-1"));
    expect(options.staleTime).toBe(DICTATION_PROGRESS_STALE_TIME);
    expect(options.staleTime).toBe(Infinity);
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.retry).toBe(false);
  });

  it("loads progress through the authenticated request helper", async () => {
    getDictationProgress.mockResolvedValue(progress);
    const options = getDictationProgressQueryOptions("user-1", "video-1");

    await expect(options.queryFn()).resolves.toEqual(progress);
    expect(runAuthenticatedRequest).toHaveBeenCalledOnce();
    expect(getDictationProgress).toHaveBeenCalledWith("token", "video-1");
  });

  it("writes submitted progress into the shared query cache", () => {
    const queryClient = new QueryClient();

    setDictationProgressQueryData(queryClient, "user-1", progress);

    expect(
      queryClient.getQueryData(getDictationProgressQueryKey("user-1", "video-1")),
    ).toEqual(progress);
  });
});
