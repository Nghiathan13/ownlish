export type ContextEvidenceSegment =
  | { type: "text"; value: string }
  | { type: "evidence"; questionNumbers: number[]; value: string };

const CONTEXT_EVIDENCE_MARKER_PATTERN = /\{\{(\/?q)(\d+)\}\}/g;

type StackFrame = {
  questionNumber: number;
  parts: string[];
  pairedQuestionNumbers: number[];
};

export function hasContextEvidenceMarkers(content: string | null | undefined) {
  return Boolean(content?.includes("{{q"));
}

function buildEvidenceQuestionNumbers(
  questionNumber: number,
  pairedQuestionNumbers: number[],
) {
  return [...pairedQuestionNumbers, questionNumber].sort((left, right) => left - right);
}

export function parseContextEvidence(content: string): ContextEvidenceSegment[] {
  const segments: ContextEvidenceSegment[] = [];
  let plainBuffer = "";
  const stack: StackFrame[] = [];

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

    for (const frame of stack) {
      frame.parts.push(text);
    }
  };

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CONTEXT_EVIDENCE_MARKER_PATTERN.exec(content)) !== null) {
    appendText(content.slice(lastIndex, match.index));

    const isClose = match[1] === "/q";
    const questionNumber = Number(match[2]);

    if (!isClose) {
      stack.push({ questionNumber, parts: [], pairedQuestionNumbers: [] });
    } else {
      const frameIndex = stack.findIndex(
        (frame) => frame.questionNumber === questionNumber,
      );

      if (frameIndex === -1) {
        lastIndex = match.index + match[0].length;
        continue;
      }

      const isTopFrame = frameIndex === stack.length - 1;

      if (isTopFrame) {
        const closed = stack.pop()!;
        const value = closed.parts.join("");
        const parent = stack[stack.length - 1];

        if (parent) {
          parent.pairedQuestionNumbers.push(closed.questionNumber);
        } else if (value) {
          flushPlain();
          segments.push({
            type: "evidence",
            questionNumbers: buildEvidenceQuestionNumbers(
              closed.questionNumber,
              closed.pairedQuestionNumbers,
            ),
            value,
          });
        }
      } else {
        const [closed] = stack.splice(frameIndex, 1);

        if (!closed) {
          lastIndex = match.index + match[0].length;
          continue;
        }

        for (const frame of stack) {
          frame.pairedQuestionNumbers.push(closed.questionNumber);
        }
      }
    }

    lastIndex = match.index + match[0].length;
  }

  appendText(content.slice(lastIndex));
  flushPlain();

  return segments;
}
