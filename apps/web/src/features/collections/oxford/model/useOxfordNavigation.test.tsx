import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("allows selecting a new band before the previous route has committed", () => {
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
  });
});
