export type DonutRingPart = {
  fill: string;
  stroke: string;
  percent: number;
};

export type DonutRingSegment = DonutRingPart & {
  startDeg: number;
  endDeg: number;
};

/**
 * Outer size-42 / hole size-28 in user space (1 unit ≈ 1px at default).
 * r_out was 80 (+4 → 84); r_in was 60 then −4 → 56.
 */
export const DONUT_R_OUT = 84;
export const DONUT_R_IN = 56;
export const DONUT_VIEWBOX = DONUT_R_OUT * 2;
export const DONUT_CENTER = DONUT_R_OUT;
/** Extra SVG viewBox pad so outer stroke anti-alias is not clipped (esp. bottom edge). */
export const DONUT_SVG_PAD = 3;
export const DONUT_SVG_PAD_PX = 3;
/**
 * Inner pad (mirror of outer): shrink the hole so inner stroke AA can paint
 * toward the center. Soft fill is masked to r_in→r_out so this pad stays clear.
 */
const DONUT_INNER_PAD = DONUT_SVG_PAD;
const DONUT_HOLE_R = DONUT_R_IN - DONUT_INNER_PAD;
export const DONUT_HOLE_DIAMETER_PCT = ((DONUT_HOLE_R * 2) / DONUT_VIEWBOX) * 100;
/** closest-side 100% = r_out of the outer disc. */
const DONUT_R_IN_MASK_PCT = (DONUT_R_IN / DONUT_R_OUT) * 100;
export const DONUT_RING_MASK = `radial-gradient(circle closest-side at center, transparent ${DONUT_R_IN_MASK_PCT}%, #000 ${DONUT_R_IN_MASK_PCT}%, #000 100%)`;
/** Ring thickness + extra length past inner/outer edges (split evenly). */
const DONUT_DIVIDER_EXTRA = 5;
export const DONUT_R_IN_LINE = DONUT_R_IN - DONUT_DIVIDER_EXTRA / 2;
export const DONUT_R_OUT_LINE = DONUT_R_OUT + DONUT_DIVIDER_EXTRA / 2;
/** White gap between parts; side borders are separate rects inside each part. */
export const DONUT_DIVIDER_WIDTH = 4;
export const DONUT_SEGMENT_STROKE_WIDTH = 2;
/** Side rect length: ring thickness (was −1px, then +1 → full thickness). */
export const DONUT_SIDE_RECT_LENGTH = DONUT_R_OUT - DONUT_R_IN;
/** Mid-radius of side rects; −1px pulls both side borders toward the center. */
export const DONUT_SIDE_RECT_R_MID = (DONUT_R_IN + DONUT_R_OUT) / 2 - 1;
/**
 * Place the side rect (same width as segment stroke) inside the part.
 * Tuned so side borders clear the white divider.
 */
export const DONUT_SIDE_RECT_OFFSET_PX = 3;
/**
 * Stroke is centered on the path.
 * Outer: inset from r_out (into the ring) so the full stroke sits inside the disc.
 * Inner: inset from r_in toward the center (into the inner pad) — mirror of outer —
 * so AA is not covered by the hole.
 */
const DONUT_R_OUT_STROKE = DONUT_R_OUT - DONUT_SEGMENT_STROKE_WIDTH / 2;
const DONUT_R_IN_STROKE = DONUT_R_IN - DONUT_SEGMENT_STROKE_WIDTH / 2;
/**
 * Legend swatch outer edge = ring thickness. With border-box + segment stroke,
 * the border is counted inside that size (fill is smaller by 2×stroke).
 */
export const DONUT_LEGEND_SWATCH_SIZE = DONUT_R_OUT - DONUT_R_IN;

/**
 * Minimum visual share for any non-zero donut segment (degrees ≈ percent of ring).
 * Purely cosmetic so tiny parts stay readable; legend still uses real counts.
 */
const DONUT_MIN_SEGMENT_PERCENT = 2;

export function getRingSegments(parts: DonutRingPart[]): DonutRingSegment[] {
  const visibleParts = parts.filter((part) => part.percent > 0);
  if (visibleParts.length === 0) return [];

  // Cap the floor so n tiny parts cannot exceed a full ring.
  const minPercent = Math.min(
    DONUT_MIN_SEGMENT_PERCENT,
    100 / visibleParts.length,
  );

  let visualPercents = visibleParts.map((part) =>
    Math.max(part.percent, minPercent),
  );
  let totalPercent = visualPercents.reduce(
    (total, percent) => total + percent,
    0,
  );

  // Flooring small slices can push the sum past 100% — take the excess
  // proportionally from slices still above the minimum.
  if (totalPercent > 100) {
    const excess = totalPercent - 100;
    const flexible = visualPercents.map((percent) =>
      Math.max(0, percent - minPercent),
    );
    const flexibleTotal = flexible.reduce((total, value) => total + value, 0);

    visualPercents =
      flexibleTotal > 0
        ? visualPercents.map(
            (percent, index) =>
              percent - (excess * flexible[index]) / flexibleTotal,
          )
        : visualPercents.map(() => 100 / visibleParts.length);
    totalPercent = 100;
  }

  let cursor = 0;

  return visibleParts.map((part, index) => {
    const size = (visualPercents[index] / totalPercent) * 360;
    const startDeg = cursor;
    const endDeg = cursor + size;
    cursor = endDeg;
    return { ...part, startDeg, endDeg };
  });
}

export function createRingBackground(segments: DonutRingSegment[]) {
  if (segments.length === 0) {
    return "var(--status-new-background)";
  }
  if (segments.length === 1) {
    return segments[0].fill;
  }

  const stops = segments.map(
    (segment) =>
      `${segment.fill} ${segment.startDeg}deg ${segment.endDeg}deg`,
  );
  return `conic-gradient(${stops.join(", ")})`;
}

function polarPoint(radius: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: DONUT_CENTER + radius * Math.sin(angleRad),
    y: DONUT_CENTER - radius * Math.cos(angleRad),
  };
}

/** Outer + inner arcs for a segment (CSS conic degrees: 0 at top, clockwise). */
export function describeRingArcs(startDeg: number, endDeg: number) {
  // Use raw span first: (360 % 360) === 0, so a full ring must not be reduced.
  const rawDelta = endDeg - startDeg;

  // Full ring: two semicircles each so the stroke is continuous.
  if (rawDelta >= 359.99) {
    return [
      `M ${DONUT_CENTER + DONUT_R_OUT_STROKE} ${DONUT_CENTER} A ${DONUT_R_OUT_STROKE} ${DONUT_R_OUT_STROKE} 0 1 1 ${DONUT_CENTER - DONUT_R_OUT_STROKE} ${DONUT_CENTER} A ${DONUT_R_OUT_STROKE} ${DONUT_R_OUT_STROKE} 0 1 1 ${DONUT_CENTER + DONUT_R_OUT_STROKE} ${DONUT_CENTER}`,
      `M ${DONUT_CENTER + DONUT_R_IN_STROKE} ${DONUT_CENTER} A ${DONUT_R_IN_STROKE} ${DONUT_R_IN_STROKE} 0 1 1 ${DONUT_CENTER - DONUT_R_IN_STROKE} ${DONUT_CENTER} A ${DONUT_R_IN_STROKE} ${DONUT_R_IN_STROKE} 0 1 1 ${DONUT_CENTER + DONUT_R_IN_STROKE} ${DONUT_CENTER}`,
    ];
  }

  const delta = ((rawDelta % 360) + 360) % 360;

  if (delta < 0.01) {
    return [];
  }

  const outerStart = polarPoint(DONUT_R_OUT_STROKE, startDeg);
  const outerEnd = polarPoint(DONUT_R_OUT_STROKE, endDeg);
  const innerStart = polarPoint(DONUT_R_IN_STROKE, startDeg);
  const innerEnd = polarPoint(DONUT_R_IN_STROKE, endDeg);
  const largeArc = delta > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y} A ${DONUT_R_OUT_STROKE} ${DONUT_R_OUT_STROKE} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `M ${innerStart.x} ${innerStart.y} A ${DONUT_R_IN_STROKE} ${DONUT_R_IN_STROKE} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
  ];
}
