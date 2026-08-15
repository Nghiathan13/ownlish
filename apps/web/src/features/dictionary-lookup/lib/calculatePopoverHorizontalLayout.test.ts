import { describe, expect, it } from "vitest";
import { calculatePopoverHorizontalLayout } from "./calculatePopoverHorizontalLayout";

describe("calculatePopoverHorizontalLayout", () => {
  it("aligns the popup start edge with the selected word when it fits to the right", () => {
    expect(
      calculatePopoverHorizontalLayout({
        referenceWidth: 20,
        width: 360,
        startOverflow: { left: -92, right: -564 },
        endOverflow: { left: -432, right: -224 },
      }),
    ).toEqual({ offset: 0, width: 360 });
  });

  it("aligns the popup end edge with the selected word when it cannot fit to the right", () => {
    expect(
      calculatePopoverHorizontalLayout({
        referenceWidth: 20,
        width: 360,
        startOverflow: { left: -792, right: 164 },
        endOverflow: { left: -452, right: -176 },
      }),
    ).toEqual({ offset: -340, width: 360 });
  });

  it("centers the popup in the viewport when neither edge alignment fits", () => {
    expect(
      calculatePopoverHorizontalLayout({
        referenceWidth: 20,
        width: 360,
        startOverflow: { left: -314, right: 206 },
        endOverflow: { left: 26, right: -134 },
      }),
    ).toEqual({ offset: -260, width: 360 });
  });

  it("shrinks the viewport-centered popup while preserving 16px margins", () => {
    expect(
      calculatePopoverHorizontalLayout({
        referenceWidth: 20,
        width: 360,
        startOverflow: { left: -134, right: 206 },
        endOverflow: { left: 206, right: -134 },
      }),
    ).toEqual({ offset: -134, width: 288 });
  });
});
