export type ContextEvidenceSegment =
  | { type: "text"; value: string }
  | { type: "evidence"; questionNumber: number; value: string };

const CONTEXT_EVIDENCE_MARKER_PATTERN = /\{\{(\/?q)(\d+)\}\}/g;

export function hasContextEvidenceMarkers(content: string | null | undefined) {
  return Boolean(content?.includes("{{q"));
}

export function parseContextEvidence(content: string): ContextEvidenceSegment[] {
  const segments: ContextEvidenceSegment[] = [];
  let plainBuffer = "";
  const stack: { questionNumber: number; parts: string[] }[] = [];

  const flushPlain = () => {
    if (!plainBuffer) {
      return;
    }

    segments.push({ type: "text", value: plainBuffer });
    plainBuffer = "";
  };

  const appendText = (text: string) => {
    if (!text) {
      return;
    }

    if (stack.length === 0) {
      plainBuffer += text;
      return;
    }

    stack[stack.length - 1]!.parts.push(text);
  };

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CONTEXT_EVIDENCE_MARKER_PATTERN.exec(content)) !== null) {
    appendText(content.slice(lastIndex, match.index));

    const isClose = match[1] === "/q";
    const questionNumber = Number(match[2]);

    if (!isClose) {
      stack.push({ questionNumber, parts: [] });
    } else {
      const top = stack[stack.length - 1];

      if (top?.questionNumber === questionNumber) {
        stack.pop();
        const value = top.parts.join("");

        if (value) {
          flushPlain();
          segments.push({ type: "evidence", questionNumber, value });
        }
      }
    }

    lastIndex = match.index + match[0].length;
  }

  appendText(content.slice(lastIndex));
  flushPlain();

  return segments;
}
