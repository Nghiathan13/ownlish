import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setDictationProgressQueryData } from "./progressQuery";
import type { DictationProgress } from "./types";
import { useDictationProgressQueries } from "./useDictationProgressQueries";
import { useDictationProgressQuery } from "./useDictationProgressQuery";

const getDictationProgress = vi.hoisted(() => vi.fn());

vi.mock("../api/progress", () => ({ getDictationProgress }));
vi.mock("@/entities/session/@x/dictation-study", () => ({
  runAuthenticatedRequest: ({ request }: { request: (token: string) => unknown }) =>
    request("token"),
}));

const progress: DictationProgress = {
  videoId: "video-1",
  answeredSegmentIds: ["s001"],
  correctCount: 1,
  completedAt: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("dictation progress query hooks", () => {
  beforeEach(() => {
    getDictationProgress.mockReset();
    getDictationProgress.mockResolvedValue(progress);
  });

  it("does not fetch until the query is enabled", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(
      () =>
        useDictationProgressQuery({
          enabled: false,
          userId: "user-1",
          videoId: "video-1",
        }),
      { wrapper: createWrapper(client) },
    );

    expect(getDictationProgress).not.toHaveBeenCalled();
  });

  it("reads progress already written to the shared cache without refetching", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setDictationProgressQueryData(client, "user-1", progress);

    const { result } = renderHook(
      () =>
        useDictationProgressQuery({
          userId: "user-1",
          videoId: "video-1",
        }),
      { wrapper: createWrapper(client) },
    );

    await waitFor(() => expect(result.current.data).toEqual(progress));
    expect(getDictationProgress).not.toHaveBeenCalled();
  });

  it("fetches a single video and reuses that cache for the list hook", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createWrapper(client);

    const single = renderHook(
      () =>
        useDictationProgressQuery({
          userId: "user-1",
          videoId: "video-1",
        }),
      { wrapper },
    );

    await waitFor(() => expect(single.result.current.data).toEqual(progress));
    expect(getDictationProgress).toHaveBeenCalledTimes(1);

    const list = renderHook(
      () =>
        useDictationProgressQueries({
          userId: "user-1",
          videoIds: ["video-1"],
        }),
      { wrapper },
    );

    await waitFor(() => expect(list.result.current[0]?.data).toEqual(progress));
    expect(getDictationProgress).toHaveBeenCalledTimes(1);
  });

  it("fetches each listed video once", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    getDictationProgress.mockImplementation((_token: string, videoId: string) =>
      Promise.resolve({ ...progress, videoId }),
    );

    const { result } = renderHook(
      () =>
        useDictationProgressQueries({
          userId: "user-1",
          videoIds: ["video-1", "video-2"],
        }),
      { wrapper: createWrapper(client) },
    );

    await waitFor(() => {
      expect(result.current[0]?.data?.videoId).toBe("video-1");
      expect(result.current[1]?.data?.videoId).toBe("video-2");
    });
    expect(getDictationProgress).toHaveBeenCalledTimes(2);
  });
});
