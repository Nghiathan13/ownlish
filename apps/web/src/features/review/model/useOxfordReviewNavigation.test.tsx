import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing";
import { useOxfordReviewNavigation } from "./useOxfordReviewNavigation";

const mocks = vi.hoisted(() => {
  const push = vi.fn();

  return { push, router: { push } };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

describe("useOxfordReviewNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/review/oxford?band=A1&group=1");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/review/oxford?band=A1&group=1");
  });

  it("prefetches the selected part before navigating", () => {
    const queryClient = createTestQueryClient();
    const prefetchQuery = vi
      .spyOn(queryClient, "prefetchQuery")
      .mockResolvedValue(undefined);
    const { result } = renderHook(
      () =>
        useOxfordReviewNavigation({
          bandParam: "A1",
          isAuthenticated: true,
          groupParam: "1",
          userId: "user-id",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.navigatePart(2);
    });

    expect(prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["oxford-part-review", "user-id", "A1", 2],
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/review/oxford?band=A1&group=2", {
      scroll: false,
    });
    expect(result.current.part).toBe(2);
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      "/review/oxford?band=A1&group=2",
    );
    expect(prefetchQuery.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.push.mock.invocationCallOrder[0],
    );
  });

  it("prefetches Part 1 when changing bands", () => {
    const queryClient = createTestQueryClient();
    const prefetchQuery = vi
      .spyOn(queryClient, "prefetchQuery")
      .mockResolvedValue(undefined);
    const { result } = renderHook(
      () =>
        useOxfordReviewNavigation({
          bandParam: "A1",
          isAuthenticated: true,
          groupParam: "1",
          userId: "user-id",
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.navigateBand("B1");
    });

    expect(prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["oxford-part-review", "user-id", "B1", 1],
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/review/oxford?band=B1&group=1", {
      scroll: false,
    });
    expect(result.current.band).toBe("B1");
    expect(result.current.part).toBe(1);
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      "/review/oxford?band=B1&group=1",
    );
  });
});
