import type { ContentEvidenceSegment } from "@/entities/toeic/api/types";

export function contentEvidenceSegmentsHaveEvidence(
  segments: ContentEvidenceSegment[] | null | undefined,
) {
  return Boolean(segments?.some((segment) => segment.type === "evidence"));
}

export function joinContentEvidenceSegments(
  segments: ContentEvidenceSegment[] | null | undefined,
) {
  if (!segments || segments.length === 0) {
    return null;
  }

  const text = segments.map((segment) => segment.value).join("");
  return text || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function buildQuestionNumberById(questions: unknown[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of questions) {
    const question = asRecord(item);
    const id = asString(question?.id);
    const number = question?.number;
    if (id && typeof number === "number" && Number.isInteger(number)) {
      map.set(id, number);
    }
  }

  return map;
}

/**
 * Convert catalog transcript segments (`text` + `questionIds`) into UI
 * evidence segments. Multi-id segments become one evidence span with
 * multiple questionNumbers (overlapping evidence).
 */
export function transcriptToContentEvidenceSegments(
  transcript: unknown,
  language: "en" | "vi",
  questions: unknown[],
): ContentEvidenceSegment[] | null {
  const languageSegments = asRecord(transcript)?.[language];
  if (!Array.isArray(languageSegments) || languageSegments.length === 0) {
    return null;
  }

  const questionNumberById = buildQuestionNumberById(questions);
  const segments: ContentEvidenceSegment[] = [];

  for (const item of languageSegments) {
    const segment = asRecord(item);
    const text = asString(segment?.text);
    if (text === null) {
      continue;
    }

    const rawIds = Array.isArray(segment?.questionIds)
      ? segment.questionIds
      : [];
    const questionNumbers = [
      ...new Set(
        rawIds
          .map((id) =>
            typeof id === "string" ? questionNumberById.get(id) : undefined,
          )
          .filter((number): number is number => typeof number === "number"),
      ),
    ].sort((left, right) => left - right);

    if (questionNumbers.length === 0) {
      segments.push({ type: "text", value: text });
      continue;
    }

    segments.push({
      type: "evidence",
      questionNumbers,
      value: text,
    });
  }

  return segments.length > 0 ? segments : null;
}
