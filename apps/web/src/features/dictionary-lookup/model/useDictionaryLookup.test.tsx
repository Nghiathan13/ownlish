import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing";
import { useDictionaryLookup } from "./useDictionaryLookup";

const dictionaryRoot = vi.hoisted(() => ({ value: "https://content.example/dictionary" }));
const mocks = vi.hoisted(() => ({ getPublicDictionaryEntry: vi.fn() }));

vi.mock("@/entities/dictionary", () => ({
  getPublicDictionaryEntry: mocks.getPublicDictionaryEntry,
}));

vi.mock("@/shared/config", () => ({
  get DICTIONARY_ROOT() {
    return dictionaryRoot.value;
  },
}));

describe("useDictionaryLookup", () => {
  beforeEach(() => {
    dictionaryRoot.value = "https://content.example/dictionary";
    mocks.getPublicDictionaryEntry.mockReset();
  });

  it("does not fetch without a selected word", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDictionaryLookup(null), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mocks.getPublicDictionaryEntry).not.toHaveBeenCalled();
  });

  it("loads the selected word with the query abort signal", async () => {
    const entry = { word: "a", etymologies: [] };
    mocks.getPublicDictionaryEntry.mockResolvedValue(entry);
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDictionaryLookup("a"), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(entry);
    });

    expect(mocks.getPublicDictionaryEntry).toHaveBeenCalledWith("a", {
      signal: expect.any(AbortSignal),
    });
  });
});
