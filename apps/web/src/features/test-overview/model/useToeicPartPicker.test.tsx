import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogTestSummary } from "./catalogTestSummary";
import { useToeicPartPicker } from "./useToeicPartPicker";

const test: CatalogTestSummary = {
  catalog: {
    id: "ets-2023-1",
    series: "ETS",
    year: 2023,
    testNumber: 1,
    complete: true,
    parts: [],
  },
  totalQuestions: 10,
  parts: [
    { partNumber: 1, partCorrectCount: 1, partWrongCount: 2 },
    { partNumber: 2, partCorrectCount: 0, partWrongCount: 0 },
  ],
};

describe("useToeicPartPicker", () => {
  it("toggles parts and starts practice or mock", () => {
    const onStart = vi.fn();
    const onStartMock = vi.fn();
    const { result } = renderHook(() =>
      useToeicPartPicker({
        intent: "practice",
        isStarting: false,
        onStart,
        onStartMock,
        test,
      }),
    );

    act(() => {
      result.current.togglePart(1);
    });

    expect(result.current.selectedParts).toEqual([1]);
    expect(result.current.selectedWrongCount).toBe(2);
    expect(result.current.isPracticeDisabled).toBe(false);

    act(() => {
      result.current.startWithMode("practice");
    });
    expect(onStart).toHaveBeenCalledWith([1], "practice");

    act(() => {
      result.current.startMock(45);
    });
    expect(onStartMock).toHaveBeenCalledWith([1], 45);
  });

  it("selects every part and ignores an empty start", () => {
    const onStart = vi.fn();
    const { result } = renderHook(() =>
      useToeicPartPicker({
        intent: "practice",
        isStarting: false,
        onStart,
        test,
      }),
    );

    act(() => {
      result.current.toggleAllParts();
    });
    expect(result.current.areAllPartsChecked).toBe(true);
    expect(result.current.selectedParts).toHaveLength(7);

    act(() => {
      result.current.toggleAllParts();
    });
    expect(result.current.selectedParts).toEqual([]);

    act(() => {
      result.current.startWithMode("practice");
    });
    expect(onStart).not.toHaveBeenCalled();
  });
});
