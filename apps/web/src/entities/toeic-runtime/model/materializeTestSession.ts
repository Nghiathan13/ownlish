import type {
  ToeicQuestion,
  ToeicQuestionGroup,
} from "@/entities/toeic/api/types";
import { resolveToeicCatalogGroupMedia } from "@/entities/toeic-catalog/model/media";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import type { ToeicRuntimeRun } from "./types";

type OptionKey = "A" | "B" | "C" | "D";

export type RuntimeTestSessionMode = "practice" | "review_wrong" | "mock_test";

export type RuntimeTestSession = {
  sessionId: string;
  testKey: string;
  series: string;
  year: number;
  testNumber: number;
  mode: RuntimeTestSessionMode;
  partNumbers: number[];
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  isFinished: boolean;
  groups: ToeicQuestionGroup[];
  questionKeyById: Map<number, string>;
  groupKeyById: Map<number, string>;
};

export type RuntimeTestPartDocument = {
  partNumber: number;
  document: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function optionText(question: Record<string, unknown>, key: OptionKey, language: "en" | "vi") {
  const options = Array.isArray(question.options) ? question.options : [];
  const option = options.find((value) => asRecord(value)?.key === key);
  return asString(asRecord(option)?.[language]);
}

function contentText(value: unknown, language: "en" | "vi"): string | null {
  return asString(asRecord(value)?.[language]);
}

function transcriptText(value: unknown, language: "en" | "vi"): string | null {
  const transcript = asRecord(value)?.[language];
  if (!Array.isArray(transcript)) {
    return null;
  }

  const text = transcript
    .map((segment) => asString(asRecord(segment)?.text))
    .filter((segment): segment is string => segment !== null)
    .join("");
  return text || null;
}

function documentText(value: unknown, language: "en" | "vi"): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const text = value
    .map((document) => contentText(asRecord(document)?.content, language))
    .filter((document): document is string => document !== null)
    .join("\n\n");
  return text || null;
}

function getGroupText(group: Record<string, unknown>, language: "en" | "vi") {
  return (
    contentText(group.content, language) ??
    transcriptText(group.transcript, language) ??
    documentText(group.documents, language)
  );
}

function toQuestion(
  question: Record<string, unknown>,
  id: number,
  answer: ToeicRuntimeRun["answers"][number] | undefined,
): ToeicQuestion | null {
  const questionNumber = question.number;
  const answerKey = question.answer;

  if (
    typeof questionNumber !== "number" ||
    !Number.isInteger(questionNumber) ||
    !["A", "B", "C", "D"].includes(answerKey as string)
  ) {
    return null;
  }

  const status = answer?.status ?? null;
  return {
    id,
    questionNumber,
    sessionQuestionNumber: null,
    question: contentText(question.question, "en"),
    questionVi: contentText(question.question, "vi"),
    options: {
      A: optionText(question, "A", "en"),
      B: optionText(question, "B", "en"),
      C: optionText(question, "C", "en"),
      D: optionText(question, "D", "en"),
      A_vi: optionText(question, "A", "vi"),
      B_vi: optionText(question, "B", "vi"),
      C_vi: optionText(question, "C", "vi"),
      D_vi: optionText(question, "D", "vi"),
    },
    optionCount: Array.isArray(question.options) ? question.options.length : 0,
    answerKey: answerKey as OptionKey,
    selectedKey: answer?.selectedKey ?? null,
    status,
    isCorrect: status === "right" ? true : status === "wrong" ? false : null,
  };
}

function toRawGroups(document: unknown) {
  const root = asRecord(document);
  const groups = Array.isArray(root?.groups) ? root.groups : [];
  if (groups.length > 0) {
    return groups.map(asRecord).filter((group): group is Record<string, unknown> => group !== null);
  }

  const items = Array.isArray(root?.items) ? root.items : [];
  return items.flatMap((item) => {
    const question = asRecord(item);
    const questionKey = asString(question?.id);
    if (!question || !questionKey) {
      return [];
    }

    return [{
      id: questionKey,
      kind: "single_question",
      audioUrl: question.audioUrl,
      imageUrl: question.imageUrl,
      questions: [question],
    }];
  });
}

export function materializeTestSession(
  documents: RuntimeTestPartDocument[],
  source: ToeicCatalogSource,
  run: ToeicRuntimeRun,
  mode: RuntimeTestSessionMode,
): RuntimeTestSession {
  if (run.scope !== "test" || !run.testKey) {
    throw new Error("Test session is unavailable.");
  }

  const test = source.manifest.tests.find((candidate) => candidate.id === run.testKey);
  if (!test) {
    throw new Error("Test catalog data is unavailable.");
  }

  const answersByKey = new Map(run.answers.map((answer) => [answer.questionKey, answer]));
  const questionKeyById = new Map<number, string>();
  const groupKeyById = new Map<number, string>();
  const materializedGroups: ToeicQuestionGroup[] = [];
  let groupId = 0;
  let questionId = 0;

  for (const { partNumber, document } of documents) {
    for (const group of toRawGroups(document)) {
      const groupKey = asString(group.id);
      const rawQuestions = Array.isArray(group.questions) ? group.questions : [];
      const questions = rawQuestions
        .map(asRecord)
        .filter((question): question is Record<string, unknown> => question !== null)
        .filter((question) => {
          const questionKey = asString(question.id);
          return questionKey !== null && (
            mode !== "review_wrong" || answersByKey.get(questionKey)?.status === "wrong"
          );
        });

      if (!groupKey || questions.length === 0) {
        continue;
      }

      const nextGroupId = ++groupId;
      const materializedQuestions = questions.flatMap((question): ToeicQuestion[] => {
        const questionKey = asString(question.id);
        if (!questionKey) {
          return [];
        }

        const nextQuestionId = ++questionId;
        const materialized = toQuestion(
          question,
          nextQuestionId,
          answersByKey.get(questionKey),
        );
        if (!materialized) {
          return [];
        }

        questionKeyById.set(nextQuestionId, questionKey);
        return [materialized];
      });

      if (materializedQuestions.length === 0) {
        continue;
      }

      groupKeyById.set(nextGroupId, groupKey);
      const media = resolveToeicCatalogGroupMedia(source, groupKey);
      const questionNumbers = materializedQuestions.map((question) => question.questionNumber);
      materializedGroups.push({
        id: nextGroupId,
        partNumber,
        questionStart: Math.min(...questionNumbers),
        questionEnd: Math.max(...questionNumbers),
        groupStatus: materializedQuestions.every((question) => question.status === "right" || question.status === "wrong")
          ? materializedQuestions.some((question) => question.status === "wrong")
            ? "wrong"
            : "right"
          : null,
        groupType: asString(group.kind),
        accent: null,
        content: getGroupText(group, "en"),
        contentVi: getGroupText(group, "vi"),
        audioUrl: media.audioUrl,
        audioUrlExpiresAt: null,
        imageUrl: media.imageUrl,
        imageUrlExpiresAt: null,
        questions: materializedQuestions,
      });
    }
  }

  return {
    sessionId: run.sessionId,
    testKey: run.testKey,
    series: test.series,
    year: test.year,
    testNumber: test.testNumber,
    mode,
    partNumbers: run.selectedParts,
    totalQuestions: materializedGroups.flatMap((group) => group.questions).length,
    correctCount: run.correctCount,
    wrongCount: run.wrongCount,
    isFinished: run.finish.status === "completed",
    groups: materializedGroups,
    questionKeyById,
    groupKeyById,
  };
}
