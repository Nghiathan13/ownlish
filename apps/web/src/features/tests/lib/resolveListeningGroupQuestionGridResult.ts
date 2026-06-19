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
  usesDeferredGroupGrading: boolean;
  currentGroupId: number | null;
  localSelections: Readonly<Record<number, OptionKey>>;
  getPracticeAnswer: (questionId: number) => PracticeSessionAnswer | undefined;
};

function findGroupForQuestion(groups: PracticeGroup[], questionId: number) {
  return groups.find((group) =>
    group.questions.some((question) => question.id === questionId),
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
  usesDeferredGroupGrading,
  currentGroupId,
  localSelections,
  getPracticeAnswer,
}: ResolveListeningGroupQuestionGridResultParams): QuestionGridResult {
  const answer = getPracticeAnswer(questionId);
  const group = findGroupForQuestion(groups, questionId);

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

  return getQuestionGridResultFromAnswer(answer);
}
