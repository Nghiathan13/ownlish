import type {
  OptionKey,
  ToeicQuestion,
  ToeicQuestionGroup,
} from "@/entities/toeic-runtime/model/presentation";

type SessionWithGroups = {
  groups: ToeicQuestionGroup[];
};

export function toAnswerMap(groups: ToeicQuestionGroup[]) {
  return new Map(
    groups.flatMap((group) =>
      group.questions.map((question) => [question.id, question] as const),
    ),
  );
}

function getNextGroupStatus(
  questions: ToeicQuestion[],
): ToeicQuestionGroup["groupStatus"] {
  if (!questions.every(isToeicQuestionGraded)) {
    return null;
  }

  return questions.some((question) => question.status === "wrong")
    ? "wrong"
    : "right";
}

export function isToeicQuestionGraded(
  answer: Pick<ToeicQuestion, "status">,
): boolean {
  return answer.status === "right" || answer.status === "wrong";
}

export function updateQuestion<T extends SessionWithGroups>(
  current: T,
  toeicQuestionId: number,
  updater: (question: ToeicQuestion) => ToeicQuestion,
  options?: { updateGroupStatus?: boolean },
): T {
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

export function applyGradedAnswer<T extends SessionWithGroups>(
  current: T,
  toeicQuestionId: number,
  selectedKey: OptionKey,
  isCorrect: boolean,
): T {
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

export function applySelectionOnly<T extends SessionWithGroups>(
  current: T,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): T {
  return updateQuestion(current, toeicQuestionId, (question) => ({
    ...question,
    selectedKey,
    status: "selected",
    isCorrect: null,
  }));
}

export function revertGradedAnswer<T extends SessionWithGroups>(
  current: T,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): T {
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

export function updateQuestionSelection<T extends SessionWithGroups>(
  current: T,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): T {
  return updateQuestion(current, toeicQuestionId, (question) => ({
    ...question,
    selectedKey,
    status: "selected",
    isCorrect: null,
  }));
}
