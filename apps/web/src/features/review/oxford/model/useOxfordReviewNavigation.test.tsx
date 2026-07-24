import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";
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
  });

  it("prefetches the selected part before navigating", () => {
    const queryClient = createTestQueryClient();
    const prefetchQuery = vi
      .spyOn(queryClient, "prefetchQuery")
      .mockResolvedValue(undefined);
    const { result } = renderHook(
      () =>
        useOxfordReviewNavigation({
          activeBand: "A1",
          isAuthenticated: true,
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
    expect(mocks.push).toHaveBeenCalledWith("/review/oxford/A1/part-2", {
      scroll: false,
    });
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
          activeBand: "A1",
          isAuthenticated: true,
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
    expect(mocks.push).toHaveBeenCalledWith("/review/oxford/B1/part-1", {
      scroll: false,
    });
  });
});
