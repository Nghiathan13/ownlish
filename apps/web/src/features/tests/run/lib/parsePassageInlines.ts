import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "@/features/tests/run/lib/parseContextEvidence";
import type { PassageInline } from "@/features/tests/run/lib/passageContent.types";

type FormattedInlineTag = "bold" | "border";

type RawInlineSegment =
  | { type: "text"; raw: string }
  | { type: FormattedInlineTag; raw: string };

const PASSAGE_INLINE_TAGS = {
  bold: {
    open: "[bold]",
    close: "[/bold]",
  },
  border: {
    open: "[border]",
    close: "[/border]",
  },
} as const;

type InlineTagName = keyof typeof PASSAGE_INLINE_TAGS;

function findNextInlineTag(
  content: string,
  fromIndex: number,
): { index: number; tag: InlineTagName; isClose: boolean } | null {
  let next: { index: number; tag: InlineTagName; isClose: boolean } | null = null;

  for (const tag of Object.keys(PASSAGE_INLINE_TAGS) as InlineTagName[]) {
    const open = content.indexOf(PASSAGE_INLINE_TAGS[tag].open, fromIndex);
    const close = content.indexOf(PASSAGE_INLINE_TAGS[tag].close, fromIndex);

    for (const candidate of [
      open >= 0 ? { index: open, tag, isClose: false as const } : null,
      close >= 0 ? { index: close, tag, isClose: true as const } : null,
    ]) {
      if (!candidate) {
        continue;
      }

      if (!next || candidate.index < next.index) {
        next = candidate;
      }
    }
  }

  return next;
}

export function hasPassageInlineFormatMarkers(content: string | null | undefined) {
  if (!content) {
    return false;
  }

  return Object.values(PASSAGE_INLINE_TAGS).some(
    ({ open, close }) => content.includes(open) || content.includes(close),
  );
}

export function isValidPassageInlineMarkup(content: string) {
  const depth: Partial<Record<InlineTagName, number>> = {};

  for (const tag of Object.keys(PASSAGE_INLINE_TAGS) as InlineTagName[]) {
    depth[tag] = 0;
  }

  let index = 0;

  while (index < content.length) {
    const nextTag = findNextInlineTag(content, index);
    if (!nextTag) {
      break;
    }

    const { open, close } = PASSAGE_INLINE_TAGS[nextTag.tag];

    if (nextTag.isClose) {
      if ((depth[nextTag.tag] ?? 0) === 0) {
        return false;
      }

      depth[nextTag.tag] = (depth[nextTag.tag] ?? 0) - 1;
      index = nextTag.index + close.length;
      continue;
    }

    if ((depth[nextTag.tag] ?? 0) > 0) {
      return false;
    }

    depth[nextTag.tag] = (depth[nextTag.tag] ?? 0) + 1;
    index = nextTag.index + open.length;
  }

  return Object.values(depth).every((value) => value === 0);
}

function parseInlineSegments(content: string): RawInlineSegment[] | null {
  if (!isValidPassageInlineMarkup(content)) {
    return null;
  }

  if (!hasPassageInlineFormatMarkers(content)) {
    return [{ type: "text", raw: content }];
  }

  const segments: RawInlineSegment[] = [];
  let plainStart = 0;
  let index = 0;

  while (index < content.length) {
    const nextTag = findNextInlineTag(content, index);
    if (!nextTag || nextTag.isClose) {
      break;
    }

    const { open, close } = PASSAGE_INLINE_TAGS[nextTag.tag];

    if (nextTag.index > plainStart) {
      segments.push({
        type: "text",
        raw: content.slice(plainStart, nextTag.index),
      });
    }

    const closeIndex = content.indexOf(close, nextTag.index + open.length);
    if (closeIndex === -1) {
      return null;
    }

    segments.push({
      type: nextTag.tag,
      raw: content.slice(nextTag.index + open.length, closeIndex),
    });

    index = closeIndex + close.length;
    plainStart = index;
  }

  if (plainStart < content.length) {
    segments.push({
      type: "text",
      raw: content.slice(plainStart),
    });
  }

  return segments;
}

function toEvidenceInlines(content: string): PassageInline[] {
  if (!hasContextEvidenceMarkers(content)) {
    return [{ type: "text", value: content }];
  }

  return parseContextEvidence(content);
}

function segmentsToPassageInlines(segments: RawInlineSegment[]): PassageInline[] {
  const inlines: PassageInline[] = [];

  for (const segment of segments) {
    const evidenceInlines = toEvidenceInlines(segment.raw);

    if (segment.type === "text") {
      inlines.push(...evidenceInlines);
      continue;
    }

    inlines.push({
      type: segment.type,
      inlines: evidenceInlines,
    });
  }

  return inlines;
}

export function parsePassageInlines(content: string): PassageInline[] | null {
  const segments = parseInlineSegments(content);
  if (!segments) {
    return null;
  }

  return segmentsToPassageInlines(segments);
}
