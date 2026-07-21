import { describe, expect, it } from "vitest";
import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "./parseContextEvidence";

describe("parseContextEvidence", () => {
  it("detects evidence markers", () => {
    expect(hasContextEvidenceMarkers("{{q38}}text{{/q38}}")).toBe(true);
    expect(hasContextEvidenceMarkers("plain text")).toBe(false);
  });

  it("parses multiple evidence spans with plain text between", () => {
    const input = `W: {{q38}}Thanks for agreeing to help me organize the library’s annual fund-raising dinner, Klaus.{{/q38}} We hope the event brings in enough money to expand our children’s book section.

M: What task would you like me to start with?

W: {{q39}}Well, I could use some help sending out the invitations.{{/q39}}

M: OK, I can take care of that. {{q40}}Is there a list of attendees available?{{/q40}}

W: It’s in my computer files. {{q40}}I’ll e-mail it to you.{{/q40}}`;

    expect(parseContextEvidence(input)).toEqual([
      { type: "text", value: "W: " },
      {
        type: "evidence",
        questionNumbers: [38],
        value:
          "Thanks for agreeing to help me organize the library’s annual fund-raising dinner, Klaus.",
      },
      {
        type: "text",
        value: ` We hope the event brings in enough money to expand our children’s book section.

M: What task would you like me to start with?

W: `,
      },
      {
        type: "evidence",
        questionNumbers: [39],
        value: "Well, I could use some help sending out the invitations.",
      },
      {
        type: "text",
        value: `

M: OK, I can take care of that. `,
      },
      {
        type: "evidence",
        questionNumbers: [40],
        value: "Is there a list of attendees available?",
      },
      { type: "text", value: `

W: It’s in my computer files. ` },
      {
        type: "evidence",
        questionNumbers: [40],
        value: "I’ll e-mail it to you.",
      },
    ]);
  });

  it("combines nested markers into one highlight with multiple badges", () => {
    const outerClosesFirst =
      "I’m calling about {{q86}}{{q87}}the work my design team’s doing to update your company logo.{{/q86}}{{/q87}}";
    const innerClosesFirst =
      "I’m calling about {{q86}}{{q87}}the work my design team’s doing to update your company logo.{{/q87}}{{/q86}}";
    const expected = [
      { type: "text", value: "I’m calling about " },
      {
        type: "evidence",
        questionNumbers: [86, 87],
        value:
          "the work my design team’s doing to update your company logo.",
      },
    ];

    expect(parseContextEvidence(outerClosesFirst)).toEqual(expected);
    expect(parseContextEvidence(innerClosesFirst)).toEqual(expected);
  });

  it("keeps separate highlights when the same question appears twice", () => {
    const input =
      "{{q87}}first span{{/q87}} between {{q87}}second span{{/q87}}";

    expect(parseContextEvidence(input)).toEqual([
      { type: "evidence", questionNumbers: [87], value: "first span" },
      { type: "text", value: " between " },
      { type: "evidence", questionNumbers: [87], value: "second span" },
    ]);
  });

  it("parses nested evidence followed by a separate span for the inner question", () => {
    const outerClosesFirst =
      "I’m calling about {{q86}}{{q87}}the work my design team’s doing to update your company logo.{{/q86}}{{/q87}} {{q87}}I’ve just e-mailed two versions for you to review.{{/q87}}";
    const innerClosesFirst =
      "I’m calling about {{q86}}{{q87}}the work my design team’s doing to update your company logo.{{/q87}}{{/q86}} {{q87}}I’ve just e-mailed two versions for you to review.{{/q87}}";
    const expected = [
      { type: "text", value: "I’m calling about " },
      {
        type: "evidence",
        questionNumbers: [86, 87],
        value:
          "the work my design team’s doing to update your company logo.",
      },
      { type: "text", value: " " },
      {
        type: "evidence",
        questionNumbers: [87],
        value: "I’ve just e-mailed two versions for you to review.",
      },
    ];

    expect(parseContextEvidence(outerClosesFirst)).toEqual(expected);
    expect(parseContextEvidence(innerClosesFirst)).toEqual(expected);
  });
});
