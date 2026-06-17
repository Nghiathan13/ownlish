import type { PracticeSessionAnswer } from "@/features/tests/api/types";
import {
  getQuestionGridResultFromAnswer,
  isPracticeAnswerGraded,
  type QuestionGridResult,
} from "@/features/tests/lib/practiceAnswers";
import type { PracticeGroup } from "@/features/tests/lib/practiceGroups";

type OptionKey = "A" | "B" | "C" | "D";

type ResolveListeningGroupQuestionGridResultParams = {
  questionId: number;
  groups: PracticeGroup[];
  isWrongGroupReview: boolean;
  usesDeferredGroupGrading: boolean;
  lockedReviewGroupIds: ReadonlySet<number>;
  currentGroupId: number | null;
  localSelections: Readonly<Record<number, OptionKey>>;
  getPracticeAnswer: (questionId: number) => PracticeSessionAnswer | undefined;
  getNormalAnswer?: (questionId: number) => PracticeSessionAnswer | undefined;
};

function findGroupForQuestion(groups: PracticeGroup[], questionId: number) {
  return groups.find((group) =>
    group.questions.some((question) => question.id === questionId),
  );
}

function isReviewGroupLockedForGrid(
  group: PracticeGroup,
  lockedReviewGroupIds: ReadonlySet<number>,
  getPracticeAnswer: (questionId: number) => PracticeSessionAnswer | undefined,
  getNormalAnswer?: (questionId: number) => PracticeSessionAnswer | undefined,
) {
  if (lockedReviewGroupIds.has(group.group.id)) {
    return true;
  }

  const editableIds = group.questions
    .filter(
      (question) => getNormalAnswer?.(question.id)?.isCorrect !== true,
    )
    .map((question) => question.id);

  return (
    editableIds.length > 0 &&
    editableIds.every((questionId) =>
      isPracticeAnswerGraded(getPracticeAnswer(questionId)),
    )
  );
}

function isGroupRevealedForGrid(
  group: PracticeGroup,
  currentGroupId: number | null,
  localSelections: Readonly<Record<number, OptionKey>>,
  getPracticeAnswer: (questionId: number) => PracticeSessionAnswer | undefined,
) {
  if (group.group.id === currentGroupId) {
    const allQuestionsSelected = group.questions.every((question) => {
      const selectedKey =
        localSelections[question.id] ??
        getPracticeAnswer(question.id)?.selectedKey;
      return selectedKey != null;
    });
    const allGroupGraded = group.questions.every((question) =>
      isPracticeAnswerGraded(getPracticeAnswer(question.id)),
    );
    return allQuestionsSelected || allGroupGraded;
  }

  return group.questions.every((question) =>
    isPracticeAnswerGraded(getPracticeAnswer(question.id)),
  );
}

export function resolveListeningGroupQuestionGridResult({
  questionId,
  groups,
  isWrongGroupReview,
  usesDeferredGroupGrading,
  lockedReviewGroupIds,
  currentGroupId,
  localSelections,
  getPracticeAnswer,
  getNormalAnswer,
}: ResolveListeningGroupQuestionGridResultParams): QuestionGridResult {
  const reviewAnswer = getPracticeAnswer(questionId);
  const normalAnswer = getNormalAnswer?.(questionId);
  const group = findGroupForQuestion(groups, questionId);

  if (isWrongGroupReview) {
    if (normalAnswer?.isCorrect === true) {
      return "correct";
    }

    if (
      group &&
      isReviewGroupLockedForGrid(
        group,
        lockedReviewGroupIds,
        getPracticeAnswer,
        getNormalAnswer,
      )
    ) {
      return getQuestionGridResultFromAnswer(reviewAnswer);
    }

    if (
      isPracticeAnswerGraded(normalAnswer) &&
      normalAnswer?.isCorrect === false
    ) {
      return "wrong";
    }

    return null;
  }

  if (
    usesDeferredGroupGrading &&
    group &&
    !isGroupRevealedForGrid(
      group,
      currentGroupId,
      localSelections,
      getPracticeAnswer,
    )
  ) {
    return null;
  }

  return getQuestionGridResultFromAnswer(reviewAnswer);
}
