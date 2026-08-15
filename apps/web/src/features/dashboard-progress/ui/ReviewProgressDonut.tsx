"use client";

import type { OxfordProgressSummary } from "@/entities/collection";
import {
  createRingBackground,
  describeRingArcs,
  DONUT_CENTER,
  DONUT_DIVIDER_WIDTH,
  DONUT_HOLE_DIAMETER_PCT,
  DONUT_LEGEND_SWATCH_SIZE,
  DONUT_R_IN_LINE,
  DONUT_R_OUT_LINE,
  DONUT_RING_MASK,
  DONUT_SEGMENT_STROKE_WIDTH,
  DONUT_SIDE_RECT_LENGTH,
  DONUT_SIDE_RECT_OFFSET_PX,
  DONUT_SIDE_RECT_R_MID,
  DONUT_SVG_PAD,
  DONUT_SVG_PAD_PX,
  DONUT_VIEWBOX,
  getRingSegments,
  type DonutRingPart,
} from "../lib/reviewProgressDonut";
import { useT } from "@/shared/lib/providers";

type ReviewProgressDonutProps = {
  progress: OxfordProgressSummary | null;
};

export function ReviewProgressDonut({ progress }: ReviewProgressDonutProps) {
  const t = useT();
  const newCount = progress?.newCount ?? 0;
  const learningCount = progress?.learningCount ?? 0;
  const masteredCount = progress?.masteredCount ?? 0;
  const total = progress?.total ?? 0;
  const masteredPercent = total > 0 ? (masteredCount / total) * 100 : 0;
  const learningPercent = total > 0 ? (learningCount / total) * 100 : 0;
  const newPercent = total > 0 ? (newCount / total) * 100 : 0;
  const ringParts: DonutRingPart[] = [
    {
      fill: "color-mix(in srgb, var(--status-mastered) 14%, transparent)",
      stroke: "var(--status-mastered)",
      percent: masteredPercent,
    },
    {
      fill: "var(--information-background)",
      stroke: "var(--primary)",
      percent: learningPercent,
    },
    {
      // Lighter than status-new-background so the soft fill stays subtle.
      fill: "color-mix(in srgb, var(--status-new-background) 55%, transparent)",
      // status-new alone is quite light; mix with foreground so the border reads clearly.
      stroke:
        "color-mix(in srgb, var(--status-new) 45%, var(--foreground) 55%)",
      percent: newPercent,
    },
  ];
  const ringSegments = getRingSegments(ringParts);
  const ringBackground = createRingBackground(ringSegments);
  const ringDividerAngles =
    ringSegments.length > 1
      ? ringSegments.map((segment) => segment.startDeg)
      : [];

  return (
    <div className="mt-4 pr-1 flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 place-items-center">
        <div
          aria-label={`${total} ${t("dashboard.entries")}`}
          className="relative size-42 shrink-0 overflow-visible"
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background: ringBackground,
              // Only paint the annulus (r_in → r_out). Center stays clear so the
              // inner pad for stroke AA does not show soft fill bleeding inward.
              maskImage: DONUT_RING_MASK,
              WebkitMaskImage: DONUT_RING_MASK,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          />
          <svg
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              height: `calc(100% + ${DONUT_SVG_PAD_PX * 2}px)`,
              left: -DONUT_SVG_PAD_PX,
              top: -DONUT_SVG_PAD_PX,
              width: `calc(100% + ${DONUT_SVG_PAD_PX * 2}px)`,
            }}
            viewBox={`${-DONUT_SVG_PAD} ${-DONUT_SVG_PAD} ${DONUT_VIEWBOX + DONUT_SVG_PAD * 2} ${DONUT_VIEWBOX + DONUT_SVG_PAD * 2}`}
          >
            {ringSegments.map((segment) => (
              <g key={`${segment.startDeg}-${segment.endDeg}-${segment.stroke}`}>
                {describeRingArcs(segment.startDeg, segment.endDeg).map(
                  (path, index) => (
                    <path
                      d={path}
                      fill="none"
                      key={`${segment.startDeg}-arc-${index}`}
                      stroke={segment.stroke}
                      strokeLinecap="butt"
                      strokeWidth={DONUT_SEGMENT_STROKE_WIDTH}
                    />
                  ),
                )}
              </g>
            ))}
            {ringDividerAngles.map((angleDeg) => (
              <RadialRingLine
                angleDeg={angleDeg}
                className="dark:stroke-[var(--background)]"
                key={`divider-${angleDeg}`}
                stroke="var(--surface)"
                strokeWidth={DONUT_DIVIDER_WIDTH}
              />
            ))}
            {/*
              Side borders only make sense between multiple parts. A single part is a
              full ring: outer + inner arcs already close the circle continuously.
            */}
            {ringSegments.length > 1
              ? ringSegments.map((segment) => (
                  <g key={`${segment.startDeg}-${segment.endDeg}-sides`}>
                    {/* Open → into-cw, close → into-ccw (into the part, parallel to the white gap). */}
                    <SegmentRadialSideBorder
                      angleDeg={segment.startDeg}
                      side="into-cw"
                      stroke={segment.stroke}
                    />
                    <SegmentRadialSideBorder
                      angleDeg={segment.endDeg}
                      side="into-ccw"
                      stroke={segment.stroke}
                    />
                  </g>
                ))
              : null}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            {/*
              Hole is slightly smaller than r_in (inner pad) so the inner stroke + AA
              can paint toward the center without being covered — mirror of outer SVG pad.
            */}
            <div
              className="grid place-items-center rounded-full bg-surface-card text-center"
              style={{
                height: `${DONUT_HOLE_DIAMETER_PCT}%`,
                width: `${DONUT_HOLE_DIAMETER_PCT}%`,
              }}
            >
              <div className="grid gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("dashboard.total")}
                </span>
                <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                  {total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid min-w-40 shrink-0 gap-2 text-base">
        <ProgressLegendItem
          fill={ringParts[0].fill}
          label={t("dashboard.mastered")}
          stroke={ringParts[0].stroke}
          value={masteredCount}
        />
        <ProgressLegendItem
          fill={ringParts[1].fill}
          label={t("dashboard.learning")}
          stroke={ringParts[1].stroke}
          value={learningCount}
        />
        <ProgressLegendItem
          fill={ringParts[2].fill}
          label={t("dashboard.new")}
          stroke={ringParts[2].stroke}
          value={newCount}
        />
      </div>
    </div>
  );
}

function RadialRingLine({
  angleDeg,
  className,
  stroke,
  strokeWidth,
}: {
  angleDeg: number;
  className?: string;
  stroke: string;
  strokeWidth: number;
}) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const x1 = DONUT_CENTER + DONUT_R_IN_LINE * Math.sin(angleRad);
  const y1 = DONUT_CENTER - DONUT_R_IN_LINE * Math.cos(angleRad);
  const x2 = DONUT_CENTER + DONUT_R_OUT_LINE * Math.sin(angleRad);
  const y2 = DONUT_CENTER - DONUT_R_OUT_LINE * Math.cos(angleRad);

  return (
    <line
      className={className}
      stroke={stroke}
      strokeLinecap="butt"
      strokeWidth={strokeWidth}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
    />
  );
}

/**
 * Radial side border for one segment edge. Same rotation as the boundary ray;
 * offset along the tangent into the part so the rect stays parallel to the white divider.
 */
function SegmentRadialSideBorder({
  angleDeg,
  side,
  stroke,
}: {
  angleDeg: number;
  side: "into-cw" | "into-ccw";
  stroke: string;
}) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const radialX = Math.sin(angleRad);
  const radialY = -Math.cos(angleRad);
  // Tangent in the direction of increasing angle (clockwise on this coordinate system).
  const tangentX = Math.cos(angleRad);
  const tangentY = Math.sin(angleRad);
  const sideSign = side === "into-cw" ? 1 : -1;
  const offset = sideSign * DONUT_SIDE_RECT_OFFSET_PX;
  const cx =
    DONUT_CENTER + DONUT_SIDE_RECT_R_MID * radialX + offset * tangentX;
  const cy =
    DONUT_CENTER + DONUT_SIDE_RECT_R_MID * radialY + offset * tangentY;
  const width = DONUT_SEGMENT_STROKE_WIDTH;
  const height = DONUT_SIDE_RECT_LENGTH;

  return (
    <rect
      fill={stroke}
      height={height}
      transform={`rotate(${angleDeg} ${cx} ${cy})`}
      width={width}
      x={cx - width / 2}
      y={cy - height / 2}
    />
  );
}

function ProgressLegendItem({
  fill,
  label,
  stroke,
  value,
}: {
  fill: string;
  label: string;
  stroke: string;
  value: number;
}) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      {/*
        Outer size = ring thickness (r_out − r_in), border-box so the 2px stroke
        is included in that size (same stroke width as the donut segments).
      */}
      <span
        aria-hidden
        className="box-border shrink-0 rounded-[2px]"
        style={{
          backgroundColor: fill,
          borderColor: stroke,
          borderStyle: "solid",
          borderWidth: DONUT_SEGMENT_STROKE_WIDTH,
          height: DONUT_LEGEND_SWATCH_SIZE,
          width: DONUT_LEGEND_SWATCH_SIZE,
        }}
      />
      <span>{label}</span>
      <span
        className="ml-auto font-mono font-semibold tabular-nums"
        style={{ color: stroke }}
      >
        {value}
      </span>
    </p>
  );
}
