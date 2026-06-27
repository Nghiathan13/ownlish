import type { AdminToeicAnswerKey, AdminToeicQuestionFields } from "@/features/admin/toeic/api/types";
import {
  cloneEditorState,
  normalizeEditorNullableString,
  type AdminGroupEditorState,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import type { AdminGroupRawEditParseResult } from "@/features/admin/toeic/detail/lib/adminGroupRawEditTypes";
import {
  getVisibleAdminToeicGroupEditorFields,
  isAdminToeicGroupEditorFieldVisible,
  isAdminToeicQuestionEditorFieldVisible,
} from "@/features/admin/toeic/detail/lib/adminToeicEditorVisibility";

const HEREDOC_START = "<<<";
const HEREDOC_END = ">>>";
const QUESTION_PREFIX = "Q.";
const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const EN_OPTION_FIELDS = ["optionA", "optionB", "optionC", "optionD"] as const;
const VI_OPTION_FIELDS = ["optionAVi", "optionBVi", "optionCVi", "optionDVi"] as const;

type ParseError = { error: string };
type BilingualLocale = "en" | "vi";

function isParseError<T>(value: T | ParseError): value is ParseError {
  return typeof value === "object" && value !== null && "error" in value;
}

function isSectionHeader(line: string) {
  return line.startsWith("# ");
}

function getSectionName(line: string) {
  return line.slice(2).trim();
}

function parseAnswerKey(value: string): AdminToeicAnswerKey | ParseError {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed === "A" || trimmed === "B" || trimmed === "C" || trimmed === "D") {
    return trimmed;
  }

  return { error: "answer must be A, B, C, D, or empty" };
}

function parseOptionLine(
  line: string,
  path: string,
): { key: (typeof OPTION_KEYS)[number]; value: string | null } | ParseError {
  const match = line.match(/^\(([ABCD])\)\s?(.*)$/);
  if (!match) {
    return { error: `${path}: expected option line like (A) text` };
  }

  const key = match[1] as (typeof OPTION_KEYS)[number];
  const value = normalizeEditorNullableString(match[2] ?? "");
  return { key, value };
}

function isQuestionLine(line: string) {
  return line.startsWith(QUESTION_PREFIX);
}

function parseQuestionLine(line: string) {
  return normalizeEditorNullableString(line.slice(QUESTION_PREFIX.length).trimStart());
}

function shouldIncludeQuestionEnBlock(partNumber: number) {
  return (
    isAdminToeicQuestionEditorFieldVisible(partNumber, "question") ||
    EN_OPTION_FIELDS.some((field) =>
      isAdminToeicQuestionEditorFieldVisible(partNumber, field),
    )
  );
}

function shouldIncludeQuestionViBlock(partNumber: number) {
  return (
    isAdminToeicQuestionEditorFieldVisible(partNumber, "questionVi") ||
    VI_OPTION_FIELDS.some((field) =>
      isAdminToeicQuestionEditorFieldVisible(partNumber, field),
    )
  );
}

function showQuestionInBlock(partNumber: number, locale: BilingualLocale) {
  return isAdminToeicQuestionEditorFieldVisible(
    partNumber,
    locale === "en" ? "question" : "questionVi",
  );
}

function serializeBilingualBlock(
  draft: AdminToeicQuestionFields,
  partNumber: number,
  locale: BilingualLocale,
) {
  const sectionName = locale === "en" ? "questionEn" : "questionVi";
  const optionFields = locale === "en" ? EN_OPTION_FIELDS : VI_OPTION_FIELDS;
  const questionField = locale === "en" ? "question" : "questionVi";
  const lines = [`# ${sectionName}`];

  if (showQuestionInBlock(partNumber, locale)) {
    lines.push(`${QUESTION_PREFIX} ${draft[questionField] ?? ""}`);
  }

  for (let index = 0; index < OPTION_KEYS.length; index += 1) {
    const label = OPTION_KEYS[index]!;
    const field = optionFields[index]!;
    lines.push(`(${label}) ${draft[field] ?? ""}`);
  }

  return lines;
}

function parseBilingualBlock(
  lines: string[],
  startIndex: number,
  partNumber: number,
  locale: BilingualLocale,
  path: string,
):
  | {
      nextIndex: number;
      question: string | null;
      options: Record<(typeof OPTION_KEYS)[number], string | null>;
    }
  | ParseError {
  const optionFields = locale === "en" ? EN_OPTION_FIELDS : VI_OPTION_FIELDS;
  const questionFieldVisible = showQuestionInBlock(partNumber, locale);
  const options: Record<(typeof OPTION_KEYS)[number], string | null> = {
    A: null,
    B: null,
    C: null,
    D: null,
  };
  const seenOptions = new Set<(typeof OPTION_KEYS)[number]>();
  const questionLines: string[] = [];
  let index = startIndex;
  let sawQuestionLine = false;

  while (index < lines.length) {
    const line = lines[index]!;
    if (isSectionHeader(line)) {
      break;
    }

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (isQuestionLine(line)) {
      if (!questionFieldVisible) {
        return {
          error: `${path}: question text is not editable in this part`,
        };
      }

      if (seenOptions.size > 0) {
        return { error: `${path}: question line must appear before options` };
      }

      sawQuestionLine = true;
      questionLines.push(parseQuestionLine(line) ?? "");
      index += 1;
      continue;
    }

    const optionLine = parseOptionLine(line, path);
    if (isParseError(optionLine)) {
      if (questionFieldVisible && questionLines.length > 0 && !seenOptions.size) {
        questionLines.push(line);
        index += 1;
        continue;
      }

      return optionLine;
    }

    if (seenOptions.has(optionLine.key)) {
      return { error: `${path}: duplicate (${optionLine.key}) line` };
    }

    seenOptions.add(optionLine.key);
    options[optionLine.key] = optionLine.value;
    index += 1;
  }

  for (let optionIndex = 0; optionIndex < OPTION_KEYS.length; optionIndex += 1) {
    const label = OPTION_KEYS[optionIndex]!;
    const field = optionFields[optionIndex]!;
    if (!isAdminToeicQuestionEditorFieldVisible(partNumber, field)) {
      continue;
    }

    if (!seenOptions.has(label)) {
      return { error: `${path}: missing (${label}) line` };
    }
  }

  if (questionFieldVisible && !sawQuestionLine && questionLines.length === 0) {
    return { error: `${path}: missing Q. line` };
  }

  const question =
    questionLines.length === 0
      ? null
      : normalizeEditorNullableString(questionLines.join("\n"));

  return { nextIndex: index, question, options };
}

function applyBilingualBlock(
  draft: AdminToeicQuestionFields,
  partNumber: number,
  locale: BilingualLocale,
  question: string | null,
  options: Record<(typeof OPTION_KEYS)[number], string | null>,
) {
  const optionFields = locale === "en" ? EN_OPTION_FIELDS : VI_OPTION_FIELDS;
  const questionField = locale === "en" ? "question" : "questionVi";

  if (showQuestionInBlock(partNumber, locale)) {
    draft[questionField] = question;
  }

  for (let index = 0; index < OPTION_KEYS.length; index += 1) {
    const label = OPTION_KEYS[index]!;
    const field = optionFields[index]!;
    if (isAdminToeicQuestionEditorFieldVisible(partNumber, field)) {
      draft[field] = options[label];
    }
  }
}

function parseHeredoc(
  lines: string[],
  startIndex: number,
  sectionName: string,
): { nextIndex: number; value: string | null } | ParseError {
  if (lines[startIndex] !== HEREDOC_START) {
    return {
      error: `# ${sectionName} must be followed by ${HEREDOC_START} on the next line`,
    };
  }

  const bodyLines: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length) {
    const line = lines[index]!;
    if (line === HEREDOC_END) {
      const value = bodyLines.join("\n");
      return {
        nextIndex: index + 1,
        value: normalizeEditorNullableString(value),
      };
    }

    bodyLines.push(line);
    index += 1;
  }

  return { error: `# ${sectionName}: unclosed heredoc` };
}

export function serializeAdminGroupRawEditTxt(
  state: AdminGroupEditorState,
  partNumber: number,
): string {
  const output: string[] = [];
  const scalarGroupFields = getVisibleAdminToeicGroupEditorFields(partNumber).filter(
    (field) => field === "groupType" || field === "accent",
  );

  if (scalarGroupFields.length > 0) {
    output.push("# group");
    for (const field of scalarGroupFields) {
      output.push(`${field}=${state.draftGroup[field] ?? ""}`);
    }
  }

  for (const field of ["content", "contentVi"] as const) {
    if (!isAdminToeicGroupEditorFieldVisible(partNumber, field)) {
      continue;
    }

    if (output.length > 0) {
      output.push("");
    }

    output.push(`# ${field}`, HEREDOC_START, state.draftGroup[field] ?? "", HEREDOC_END);
  }

  for (const question of state.questions) {
    if (output.length > 0) {
      output.push("");
    }

    output.push("# question");

    if (shouldIncludeQuestionEnBlock(partNumber)) {
      output.push(...serializeBilingualBlock(question.draft, partNumber, "en"));
    }

    if (shouldIncludeQuestionViBlock(partNumber)) {
      output.push("");
      output.push(...serializeBilingualBlock(question.draft, partNumber, "vi"));
    }

    output.push("", "# answer", question.draft.answerKey ?? "");
  }

  return `${output.join("\n")}\n`;
}

export function parseAdminGroupRawEditTxt(
  text: string,
  currentState: AdminGroupEditorState,
  partNumber: number,
): AdminGroupRawEditParseResult {
  const lines = text.split(/\r?\n/);
  const nextState = cloneEditorState(currentState);
  let lineIndex = 0;
  let questionIndex = 0;
  const parsedGroupScalars = new Set<string>();
  const parsedGroupHeredocs = new Set<string>();

  const skipBlankLines = () => {
    while (lineIndex < lines.length && lines[lineIndex]!.trim() === "") {
      lineIndex += 1;
    }
  };

  skipBlankLines();

  while (lineIndex < lines.length) {
    const line = lines[lineIndex]!;

    if (!isSectionHeader(line)) {
      return {
        ok: false,
        error: `Line ${lineIndex + 1}: expected section header starting with "# "`,
      };
    }

    const sectionName = getSectionName(line);
    lineIndex += 1;

    if (sectionName === "group") {
      while (lineIndex < lines.length) {
        skipBlankLines();
        if (lineIndex >= lines.length || isSectionHeader(lines[lineIndex]!)) {
          break;
        }

        const groupLine = lines[lineIndex]!;
        const separatorIndex = groupLine.indexOf("=");
        if (separatorIndex < 0) {
          return {
            ok: false,
            error: `# group: expected key=value line, got "${groupLine}"`,
          };
        }

        const key = groupLine.slice(0, separatorIndex).trim();
        const value = normalizeEditorNullableString(
          groupLine.slice(separatorIndex + 1),
        );

        if (key !== "groupType" && key !== "accent") {
          return { ok: false, error: `# group: unknown field "${key}"` };
        }

        if (!isAdminToeicGroupEditorFieldVisible(partNumber, key)) {
          return {
            ok: false,
            error: `Field not editable in this part: ${key}`,
          };
        }

        nextState.draftGroup[key] = value;
        parsedGroupScalars.add(key);
        lineIndex += 1;
      }

      continue;
    }

    if (sectionName === "content" || sectionName === "contentVi") {
      if (!isAdminToeicGroupEditorFieldVisible(partNumber, sectionName)) {
        return {
          ok: false,
          error: `Field not editable in this part: ${sectionName}`,
        };
      }

      const heredoc = parseHeredoc(lines, lineIndex, sectionName);
      if (isParseError(heredoc)) {
        return { ok: false, error: heredoc.error };
      }

      nextState.draftGroup[sectionName] = heredoc.value;
      parsedGroupHeredocs.add(sectionName);
      lineIndex = heredoc.nextIndex;
      skipBlankLines();
      continue;
    }

    if (sectionName === "question") {
      if (questionIndex >= nextState.questions.length) {
        return {
          ok: false,
          error: `Unexpected # question: expected ${nextState.questions.length} question sections`,
        };
      }

      const questionEntry = nextState.questions[questionIndex]!;
      const questionPath = `question ${questionIndex + 1}`;
      const seenSubsections = new Set<string>();
      skipBlankLines();

      while (lineIndex < lines.length) {
        const subsectionLine = lines[lineIndex]!;
        if (
          isSectionHeader(subsectionLine) &&
          getSectionName(subsectionLine) === "question"
        ) {
          break;
        }

        if (!isSectionHeader(subsectionLine)) {
          return {
            ok: false,
            error: `${questionPath}: expected subsection header`,
          };
        }

        const subsectionName = getSectionName(subsectionLine);
        lineIndex += 1;

        if (subsectionName === "questionEn") {
          if (!shouldIncludeQuestionEnBlock(partNumber)) {
            return {
              ok: false,
              error: `${questionPath}: questionEn is not editable in this part`,
            };
          }

          const block = parseBilingualBlock(
            lines,
            lineIndex,
            partNumber,
            "en",
            `${questionPath} # questionEn`,
          );
          if (isParseError(block)) {
            return { ok: false, error: block.error };
          }

          applyBilingualBlock(
            questionEntry.draft,
            partNumber,
            "en",
            block.question,
            block.options,
          );
          lineIndex = block.nextIndex;
          seenSubsections.add("questionEn");
          skipBlankLines();
          continue;
        }

        if (subsectionName === "questionVi") {
          if (!shouldIncludeQuestionViBlock(partNumber)) {
            return {
              ok: false,
              error: `${questionPath}: questionVi is not editable in this part`,
            };
          }

          const block = parseBilingualBlock(
            lines,
            lineIndex,
            partNumber,
            "vi",
            `${questionPath} # questionVi`,
          );
          if (isParseError(block)) {
            return { ok: false, error: block.error };
          }

          applyBilingualBlock(
            questionEntry.draft,
            partNumber,
            "vi",
            block.question,
            block.options,
          );
          lineIndex = block.nextIndex;
          seenSubsections.add("questionVi");
          skipBlankLines();
          continue;
        }

        if (subsectionName === "answer") {
          if (lineIndex >= lines.length) {
            return { ok: false, error: `${questionPath}: missing answer value` };
          }

          const answerValue = parseAnswerKey(lines[lineIndex] ?? "");
          if (isParseError(answerValue)) {
            return {
              ok: false,
              error: `${questionPath}: ${answerValue.error}`,
            };
          }

          questionEntry.draft.answerKey = answerValue;
          lineIndex += 1;
          seenSubsections.add("answer");
          skipBlankLines();
          continue;
        }

        return {
          ok: false,
          error: `${questionPath}: unknown subsection "${subsectionName}"`,
        };
      }

      if (shouldIncludeQuestionEnBlock(partNumber) && !seenSubsections.has("questionEn")) {
        return { ok: false, error: `${questionPath}: missing # questionEn` };
      }

      if (shouldIncludeQuestionViBlock(partNumber) && !seenSubsections.has("questionVi")) {
        return { ok: false, error: `${questionPath}: missing # questionVi` };
      }

      if (!seenSubsections.has("answer")) {
        return { ok: false, error: `${questionPath}: missing # answer` };
      }

      questionIndex += 1;
      continue;
    }

    return { ok: false, error: `Unknown section "${sectionName}"` };
  }

  for (const field of getVisibleAdminToeicGroupEditorFields(partNumber)) {
    if (field === "groupType" || field === "accent") {
      if (!parsedGroupScalars.has(field)) {
        return { ok: false, error: `Missing # group field: ${field}` };
      }
    } else if (!parsedGroupHeredocs.has(field)) {
      return { ok: false, error: `Missing # ${field} section` };
    }
  }

  if (questionIndex !== nextState.questions.length) {
    return {
      ok: false,
      error: `Expected ${nextState.questions.length} question sections, found ${questionIndex}`,
    };
  }

  return { ok: true, state: nextState };
}
