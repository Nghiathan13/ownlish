import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  it("keeps the old value until the delay has elapsed", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    expect(result.current).toBe("first");

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("second");
    vi.useRealTimers();
  });

  it("cancels an outdated delay when the value changes again", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "third" });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("first");

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("third");
    vi.useRealTimers();
  });
});
