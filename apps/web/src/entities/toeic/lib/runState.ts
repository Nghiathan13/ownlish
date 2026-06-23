import type {
  ToeicQuestion,
  ToeicQuestionGroup,
  ToeicRunResult,
} from "@/entities/toeic/api/types";
import { isPracticeAnswerGraded } from "@/features/tests/run/lib/practiceAnswers";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

export function toAnswerMap(groups: ToeicQuestionGroup[]) {
  return new Map(
    groups.flatMap((group) =>
      group.questions.map((question) => [question.id, question] as const),
    ),
  );
}

export function getNextGroupStatus(
  questions: ToeicQuestion[],
): ToeicQuestionGroup["groupStatus"] {
  if (!questions.every((question) => isPracticeAnswerGraded(question))) {
    return null;
  }

  return questions.some((question) => question.status === "wrong")
    ? "wrong"
    : "right";
}

export function updateQuestion(
  current: ToeicRunResult,
  toeicQuestionId: number,
  updater: (question: ToeicQuestion) => ToeicQuestion,
  options?: { updateGroupStatus?: boolean },
): ToeicRunResult {
  return {
    ...current,
    groups: current.groups.map((group) => {
      let changed = false;
      const questions = group.questions.map((question) => {
        if (question.id !== toeicQuestionId) {
          return question;
        }

        changed = true;
        return updater(question);
      });

      if (!changed) {
        return group;
      }

      return {
        ...group,
        groupStatus: options?.updateGroupStatus
          ? getNextGroupStatus(questions)
          : group.groupStatus,
        questions,
      };
    }),
  };
}

export function applyGradedAnswer(
  current: ToeicRunResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
  isCorrect: boolean,
): ToeicRunResult {
  return updateQuestion(
    current,
    toeicQuestionId,
    (question) => ({
      ...question,
      selectedKey,
      status: isCorrect ? "right" : "wrong",
      isCorrect,
    }),
    { updateGroupStatus: true },
  );
}

export function applySelectionOnly(
  current: ToeicRunResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): ToeicRunResult {
  return updateQuestion(current, toeicQuestionId, (question) => ({
    ...question,
    selectedKey,
    status: "selected",
    isCorrect: null,
  }));
}

export function revertGradedAnswer(
  current: ToeicRunResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): ToeicRunResult {
  return updateQuestion(
    current,
    toeicQuestionId,
    (question) => ({
      ...question,
      selectedKey,
      status: "selected",
      isCorrect: null,
    }),
    { updateGroupStatus: true },
  );
}

export function updateQuestionSelection(
  current: ToeicRunResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): ToeicRunResult {
  return updateQuestion(current, toeicQuestionId, (question) => ({
    ...question,
    selectedKey,
    status: "selected",
    isCorrect: null,
  }));
}
