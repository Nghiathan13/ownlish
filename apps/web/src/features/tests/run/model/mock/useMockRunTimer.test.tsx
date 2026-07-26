import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMockRunTimer } from "@/features/tests/run/model/mock/useMockRunTimer";

const mocks = vi.hoisted(() => ({
  updateTimer: vi.fn(),
}));

vi.mock("@/entities/session/model/authenticatedRequest", () => ({
  runAuthenticatedRequest: ({ request }: { request: (token: string) => unknown }) =>
    request("access-token"),
}));

vi.mock("@/entities/toeic-runtime/api/runtime", () => ({
  updateRuntimeMockTimer: mocks.updateTimer,
}));

function setDocumentVisibility(visibilityState: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useMockRunTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.updateTimer.mockImplementation(
      (_token: string, _sessionId: string, remainingSeconds: number) =>
        Promise.resolve({ remainingSeconds }),
    );
    setDocumentVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setDocumentVisibility("visible");
  });

  it("counts down only while the mock tab is visible", async () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useMockRunTimer({
        sessionId: "mock-1",
        initialRemainingSeconds: 10,
        enabled: true,
        onExpire,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.remainingSeconds).toBe(8);

    await act(async () => {
      setDocumentVisibility("hidden");
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(result.current.remainingSeconds).toBe(8);
    expect(mocks.updateTimer).toHaveBeenCalledWith("access-token", "mock-1", 8);

    act(() => {
      setDocumentVisibility("visible");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current.remainingSeconds).toBe(7);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("syncs zero then expires exactly once", async () => {
    const onExpire = vi.fn();
    mocks.updateTimer.mockResolvedValue({ remainingSeconds: 0 });
    const { result } = renderHook(() =>
      useMockRunTimer({
        sessionId: "mock-1",
        initialRemainingSeconds: 1,
        enabled: true,
        onExpire,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.hasExpired).toBe(true);
    expect(mocks.updateTimer).toHaveBeenCalledWith("access-token", "mock-1", 0);
  });
});
