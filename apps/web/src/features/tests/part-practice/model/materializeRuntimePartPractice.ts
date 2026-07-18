import type {
  PartPracticeQuestionGroup,
  PartPracticeSessionResult,
  ToeicQuestion,
  ToeicQuestionGroup,
} from "@/entities/toeic/api/types";
import { resolveToeicCatalogMediaUrl } from "@/entities/toeic-catalog/api/catalog";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import type { ToeicRuntimeRun } from "@/entities/toeic-runtime/model/types";

type OptionKey = "A" | "B" | "C" | "D";

export type RuntimePartPracticeSession = PartPracticeSessionResult & {
  questionKeyById: Map<number, string>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function optionText(question: Record<string, unknown>, key: OptionKey, language: "en" | "vi") {
  const options = Array.isArray(question.options) ? question.options : [];
  const option = options.find((value) => asRecord(value)?.key === key);
  const value = asRecord(option)?.[language];
  return typeof value === "string" ? value : null;
}

function contentText(value: unknown, language: "en" | "vi"): string | null {
  const content = asRecord(value);
  const text = content?.[language];
  return typeof text === "string" ? text : null;
}

function transcriptText(value: unknown, language: "en" | "vi"): string | null {
  const transcript = asRecord(value)?.[language];
  if (!Array.isArray(transcript)) {
    return null;
  }

  const text = transcript
    .map((segment) => asRecord(segment)?.text)
    .filter((segment): segment is string => typeof segment === "string")
    .join("");
  return text || null;
}

function documentText(value: unknown, language: "en" | "vi"): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const text = value
    .map((document) => contentText(asRecord(document)?.content, language))
    .filter((document): document is string => Boolean(document))
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

export function materializeRuntimePartPractice(
  document: unknown,
  source: ToeicCatalogSource,
  run: ToeicRuntimeRun,
  mode: "practice" | "review_wrong",
): RuntimePartPracticeSession {
  const root = asRecord(document);
  const groups = Array.isArray(root?.groups) ? root.groups : [];
  const answersByKey = new Map(run.answers.map((answer) => [answer.questionKey, answer]));
  const questionKeyById = new Map<number, string>();
  let groupId = 0;
  let questionId = 0;

  const materializedGroups = groups.flatMap((item): PartPracticeQuestionGroup[] => {
    const group = asRecord(item);
    const rawQuestions = Array.isArray(group?.questions) ? group.questions : [];
    const questions = rawQuestions
      .map(asRecord)
      .filter((question): question is Record<string, unknown> => question !== null)
      .filter((question) => {
        const questionKey = question.id;
        return (
          typeof questionKey === "string" &&
          (mode !== "review_wrong" || answersByKey.get(questionKey)?.status === "wrong")
        );
      });

    if (!group || questions.length === 0) {
      return [];
    }

    const nextGroupId = ++groupId;
    const materializedQuestions = questions.flatMap((question): ToeicQuestion[] => {
      const questionKey = question.id;
      if (typeof questionKey !== "string") {
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
      return [];
    }

    const groupKey = typeof group.id === "string" ? group.id : "";
    const media = source.manifest.mediaByGroupId[groupKey];
    const questionNumbers = materializedQuestions.map((question) => question.questionNumber);
    const materializedGroup: ToeicQuestionGroup = {
      id: nextGroupId,
      partNumber: run.partNumber,
      questionStart: Math.min(...questionNumbers),
      questionEnd: Math.max(...questionNumbers),
      groupStatus: materializedQuestions.every((question) => question.status === "right" || question.status === "wrong")
        ? materializedQuestions.some((question) => question.status === "wrong")
          ? "wrong"
          : "right"
        : null,
      groupType: typeof group.kind === "string" ? group.kind : null,
      accent: null,
      content: getGroupText(group, "en"),
      contentVi: getGroupText(group, "vi"),
      audioUrl: resolveToeicCatalogMediaUrl(source, media?.audio),
      audioUrlExpiresAt: null,
      imageUrl: resolveToeicCatalogMediaUrl(source, media?.image),
      imageUrlExpiresAt: null,
      questions: materializedQuestions,
    };
    const test = asRecord(group.test);

    return [{
      ...materializedGroup,
      testId: nextGroupId,
      year: typeof test?.year === "number" ? test.year : 0,
      testNumber: typeof test?.testNumber === "number" ? test.testNumber : 0,
    }];
  });

  return {
    sessionId: run.sessionId,
    mode,
    partNumber: run.partNumber ?? 0,
    totalQuestions:
      mode === "review_wrong"
        ? materializedGroups.flatMap((group) => group.questions).length
        : typeof root?.totalQuestions === "number"
          ? root.totalQuestions
          : 0,
    correctCount: run.correctCount,
    wrongCount: run.wrongCount,
    groups: materializedGroups,
    questionKeyById,
  };
}
