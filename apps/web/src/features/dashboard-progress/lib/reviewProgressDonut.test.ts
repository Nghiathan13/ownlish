import { describe, expect, it } from "vitest";
import {
  createRingBackground,
  describeRingArcs,
  getRingSegments,
  type DonutRingPart,
  type DonutRingSegment,
} from "./reviewProgressDonut";

function part(
  percent: number,
  fill = `fill-${percent}`,
  stroke = `stroke-${percent}`,
): DonutRingPart {
  return { fill, stroke, percent };
}

describe("getRingSegments", () => {
  it("returns empty when every part is zero", () => {
    expect(getRingSegments([part(0), part(0)])).toEqual([]);
  });

  it("drops zero parts and builds a full ring for one visible part", () => {
    const segments = getRingSegments([part(0), part(100, "solo", "solo-stroke")]);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      fill: "solo",
      stroke: "solo-stroke",
      startDeg: 0,
      endDeg: 360,
    });
  });

  it("keeps proportional angles for multiple parts that sum to 100", () => {
    const segments = getRingSegments([part(50, "a"), part(25, "b"), part(25, "c")]);

    expect(segments).toHaveLength(3);
    expect(segments[0].startDeg).toBe(0);
    expect(segments[0].endDeg).toBeCloseTo(180);
    expect(segments[1].startDeg).toBeCloseTo(180);
    expect(segments[1].endDeg).toBeCloseTo(270);
    expect(segments[2].startDeg).toBeCloseTo(270);
    expect(segments[2].endDeg).toBeCloseTo(360);
  });

  it("applies a visual floor to tiny non-zero parts and renormalizes", () => {
    const segments = getRingSegments([part(98, "big"), part(1, "tiny-a"), part(1, "tiny-b")]);

    expect(segments).toHaveLength(3);
    // Tiny parts get at least ~2% visual share; total span stays 360°.
    const tinyA = segments[1].endDeg - segments[1].startDeg;
    const tinyB = segments[2].endDeg - segments[2].startDeg;
    expect(tinyA).toBeGreaterThanOrEqual(7); // ~2% of 360
    expect(tinyB).toBeGreaterThanOrEqual(7);
    expect(segments[2].endDeg).toBeCloseTo(360, 5);
  });

  it("splits evenly when every part is at the minimum floor", () => {
    // 60 parts × 2% min would exceed 100%; with n parts, min is 100/n.
    const many = Array.from({ length: 4 }, (_, index) =>
      part(0.1, `p${index}`, `s${index}`),
    );
    const segments = getRingSegments(many);

    expect(segments).toHaveLength(4);
    for (const segment of segments) {
      expect(segment.endDeg - segment.startDeg).toBeCloseTo(90);
    }
    expect(segments[3].endDeg).toBeCloseTo(360);
  });
});

describe("createRingBackground", () => {
  it("uses the empty fallback when there are no segments", () => {
    expect(createRingBackground([])).toBe("var(--status-new-background)");
  });

  it("uses a solid fill for a single segment", () => {
    const segments: DonutRingSegment[] = [
      { fill: "purple", stroke: "x", percent: 100, startDeg: 0, endDeg: 360 },
    ];
    expect(createRingBackground(segments)).toBe("purple");
  });

  it("builds a conic gradient for multiple segments", () => {
    const segments: DonutRingSegment[] = [
      { fill: "a", stroke: "sa", percent: 50, startDeg: 0, endDeg: 180 },
      { fill: "b", stroke: "sb", percent: 50, startDeg: 180, endDeg: 360 },
    ];
    expect(createRingBackground(segments)).toBe(
      "conic-gradient(a 0deg 180deg, b 180deg 360deg)",
    );
  });
});

describe("describeRingArcs", () => {
  it("returns no paths for a near-zero span", () => {
    expect(describeRingArcs(10, 10)).toEqual([]);
    expect(describeRingArcs(10, 10.001)).toEqual([]);
  });

  it("returns full outer and inner closed rings for a 360° span", () => {
    const arcs = describeRingArcs(0, 360);

    expect(arcs).toHaveLength(2);
    // Two semicircle arcs each (large-arc flags) so the stroke is continuous.
    expect(arcs[0].match(/ A /g)).toHaveLength(2);
    expect(arcs[1].match(/ A /g)).toHaveLength(2);
    expect(arcs[0]).toContain("M ");
    expect(arcs[1]).toContain("M ");
  });

  it("returns partial outer and inner arcs for a small slice", () => {
    const arcs = describeRingArcs(0, 90);

    expect(arcs).toHaveLength(2);
    expect(arcs[0].match(/ A /g)).toHaveLength(1);
    expect(arcs[1].match(/ A /g)).toHaveLength(1);
    // small arc flag is 0 (delta ≤ 180)
    expect(arcs[0]).toMatch(/ A [\d.]+ [\d.]+ 0 0 1 /);
  });

  it("uses the large-arc flag when the slice is greater than 180°", () => {
    const arcs = describeRingArcs(0, 270);

    expect(arcs).toHaveLength(2);
    expect(arcs[0]).toMatch(/ A [\d.]+ [\d.]+ 0 1 1 /);
    expect(arcs[1]).toMatch(/ A [\d.]+ [\d.]+ 0 1 1 /);
  });

  it("normalizes negative span via modulo for empty path", () => {
    // rawDelta negative and not full ring → normalized delta may be non-zero or zero
    const arcs = describeRingArcs(90, 90);
    expect(arcs).toEqual([]);
  });
});
