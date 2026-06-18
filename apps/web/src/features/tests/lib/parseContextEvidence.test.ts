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
        questionNumber: 38,
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
        questionNumber: 39,
        value: "Well, I could use some help sending out the invitations.",
      },
      {
        type: "text",
        value: `

M: OK, I can take care of that. `,
      },
      {
        type: "evidence",
        questionNumber: 40,
        value: "Is there a list of attendees available?",
      },
      { type: "text", value: `

W: It’s in my computer files. ` },
      {
        type: "evidence",
        questionNumber: 40,
        value: "I’ll e-mail it to you.",
      },
    ]);
  });

  it("handles nested markers by highlighting only the inner span", () => {
    const input =
      "I’m calling about {{q86}}{{q87}}the work my design team’s doing to update your company logo.{{/q87}}{{/q86}}";

    expect(parseContextEvidence(input)).toEqual([
      { type: "text", value: "I’m calling about " },
      {
        type: "evidence",
        questionNumber: 87,
        value:
          "the work my design team’s doing to update your company logo.",
      },
    ]);
  });
});
