import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";
import { useOxfordNavigation } from "./useOxfordNavigation";

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  const replace = vi.fn();

  return {
    push,
    replace,
    router: { push, replace },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

describe("useOxfordNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("allows selecting a new band before the previous route has committed", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(
      () =>
        useOxfordNavigation({
          bandParam: "A1",
          groupParam: null,
          isAuthenticated: false,
        }),
      { wrapper: createQueryClientWrapper(createTestQueryClient()) },
    );

    act(() => {
      result.current.navigateBand("B1");
    });
    act(() => {
      result.current.navigateBand("A1");
    });
    act(() => {
      result.current.navigateBand("B1");
    });

    expect(result.current.band).toBe("B1");
    expect(pushState).toHaveBeenNthCalledWith(
      1,
      null,
      "",
      "/collections/oxford/B1",
    );
    expect(pushState).toHaveBeenNthCalledWith(
      2,
      null,
      "",
      "/collections/oxford/A1",
    );
    expect(pushState).toHaveBeenNthCalledWith(
      3,
      null,
      "",
      "/collections/oxford/B1",
    );
    expect(mocks.push).toHaveBeenNthCalledWith(
      1,
      "/collections/oxford/B1",
      { scroll: false },
    );
    expect(mocks.push).toHaveBeenNthCalledWith(
      2,
      "/collections/oxford/A1",
      { scroll: false },
    );
    expect(mocks.push).toHaveBeenNthCalledWith(
      3,
      "/collections/oxford/B1",
      { scroll: false },
    );
    expect(pushState.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.push.mock.invocationCallOrder[0],
    );
  });

  it("updates the URL immediately for a part and its back navigation", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(
      () =>
        useOxfordNavigation({
          bandParam: "A1",
          groupParam: null,
          isAuthenticated: false,
        }),
      { wrapper: createQueryClientWrapper(createTestQueryClient()) },
    );

    act(() => {
      result.current.navigatePart(2);
    });
    act(() => {
      result.current.navigateOverview();
    });

    expect(pushState).toHaveBeenNthCalledWith(
      1,
      null,
      "",
      "/collections/oxford/A1/part-2",
    );
    expect(pushState).toHaveBeenNthCalledWith(
      2,
      null,
      "",
      "/collections/oxford/A1",
    );
    expect(mocks.push).toHaveBeenNthCalledWith(
      1,
      "/collections/oxford/A1/part-2",
      { scroll: false },
    );
    expect(mocks.push).toHaveBeenNthCalledWith(
      2,
      "/collections/oxford/A1",
      { scroll: false },
    );
  });
});
