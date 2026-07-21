import { describe, expect, it } from "vitest";
import {
  contentEvidenceSegmentsHaveEvidence,
  joinContentEvidenceSegments,
  transcriptToContentEvidenceSegments,
} from "./transcriptEvidenceSegments";

const questions = [
  { id: "ets24-t01-p4-q089", number: 89 },
  { id: "ets24-t01-p4-q090", number: 90 },
  { id: "ets24-t01-p4-q091", number: 91 },
];

describe("transcriptToContentEvidenceSegments", () => {
  it("maps empty questionIds to plain text segments", () => {
    const segments = transcriptToContentEvidenceSegments(
      {
        en: [
          { text: "Hello. ", questionIds: [] },
          { text: "World.", questionIds: [] },
        ],
      },
      "en",
      questions,
    );

    expect(segments).toEqual([
      { type: "text", value: "Hello. " },
      { type: "text", value: "World." },
    ]);
    expect(contentEvidenceSegmentsHaveEvidence(segments)).toBe(false);
    expect(joinContentEvidenceSegments(segments)).toBe("Hello. World.");
  });

  it("maps a single questionId to evidence with one question number", () => {
    const segments = transcriptToContentEvidenceSegments(
      {
        en: [
          {
            text: "Our agency won a contract.",
            questionIds: ["ets24-t01-p4-q089"],
          },
        ],
      },
      "en",
      questions,
    );

    expect(segments).toEqual([
      {
        type: "evidence",
        questionNumbers: [89],
        value: "Our agency won a contract.",
      },
    ]);
    expect(contentEvidenceSegmentsHaveEvidence(segments)).toBe(true);
  });

  it("maps multi questionIds to one evidence span with multiple numbers", () => {
    const segments = transcriptToContentEvidenceSegments(
      {
        en: [
          { text: "Intro. ", questionIds: [] },
          {
            text: "We'll be developing two ads.",
            questionIds: ["ets24-t01-p4-q089", "ets24-t01-p4-q090"],
          },
          { text: " Now.", questionIds: [] },
        ],
      },
      "en",
      questions,
    );

    expect(segments).toEqual([
      { type: "text", value: "Intro. " },
      {
        type: "evidence",
        questionNumbers: [89, 90],
        value: "We'll be developing two ads.",
      },
      { type: "text", value: " Now." },
    ]);
  });

  it("ignores unknown questionIds and treats the segment as text", () => {
    const segments = transcriptToContentEvidenceSegments(
      {
        en: [
          {
            text: "Unknown link.",
            questionIds: ["missing-id"],
          },
        ],
      },
      "en",
      questions,
    );

    expect(segments).toEqual([{ type: "text", value: "Unknown link." }]);
  });
});
