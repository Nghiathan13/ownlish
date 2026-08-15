import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  detectOverflow: vi.fn(),
}));

vi.mock("@floating-ui/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@floating-ui/react")>()),
  detectOverflow: mocks.detectOverflow,
}));

import { dictionaryPopoverHorizontalPlacement } from "./dictionaryPopoverHorizontalPlacement";

type Overflow = { left: number; right: number };

function createState({ styleWidth = "" }: { styleWidth?: string } = {}) {
  const style = { width: styleWidth };
  const floating = {
    style,
    getBoundingClientRect: vi.fn(() => ({ width: style.width ? 288 : 360 })),
  } as unknown as HTMLElement;

  return {
    elements: { floating },
    rects: {
      floating: { width: 360 },
      reference: { width: 20 },
    },
    x: 100,
  } as Parameters<NonNullable<typeof dictionaryPopoverHorizontalPlacement.fn>>[0];
}

function mockOverflows(startOverflow: Overflow, endOverflow: Overflow) {
  mocks.detectOverflow.mockResolvedValueOnce(startOverflow).mockResolvedValueOnce(endOverflow);
}

describe("dictionaryPopoverHorizontalPlacement", () => {
  beforeEach(() => {
    mocks.detectOverflow.mockReset();
  });

  it("keeps start alignment when it fits in the viewport", async () => {
    const state = createState();
    mockOverflows({ left: -100, right: -200 }, { left: -440, right: 140 });

    await expect(dictionaryPopoverHorizontalPlacement.fn!(state)).resolves.toEqual({ x: 100 });
    expect(mocks.detectOverflow).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ rects: expect.objectContaining({ floating: { width: 360 } }) }),
      { padding: 16 },
    );
  });

  it("resets a previous centered width before applying end alignment", async () => {
    const state = createState({ styleWidth: "288px" });
    mockOverflows({ left: -700, right: 20 }, { left: -360, right: -20 });

    await expect(dictionaryPopoverHorizontalPlacement.fn!(state)).resolves.toEqual({
      reset: { rects: true },
    });
    expect(state.elements.floating.style.width).toBe("");
  });

  it("sets a narrower width when the popup needs viewport-centering", async () => {
    const state = createState();
    mockOverflows({ left: -134, right: 206 }, { left: 206, right: -134 });

    await expect(dictionaryPopoverHorizontalPlacement.fn!(state)).resolves.toEqual({
      reset: { rects: true },
    });
    expect(state.elements.floating.style.width).toBe("288px");
  });

  it("uses the centered offset once its width has already been applied", async () => {
    const state = createState({ styleWidth: "288px" });
    mockOverflows({ left: -134, right: 206 }, { left: 206, right: -134 });

    await expect(dictionaryPopoverHorizontalPlacement.fn!(state)).resolves.toEqual({ x: -34 });
  });
});
