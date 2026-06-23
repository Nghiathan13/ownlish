import { ToeicRunQuestionStatus } from '@prisma/client';
import type { ToeicRunQuestionGradeState } from './toeic-run-grader.types';

export function isToeicRunGroupReadyToGrade(
  questions: ToeicRunQuestionGradeState[],
  isReviewWrongSubmission = false,
): boolean {
  return (
    questions.length > 0 &&
    questions.every(
      (question) =>
        question.status === ToeicRunQuestionStatus.RIGHT ||
        (isReviewWrongSubmission
          ? question.status === ToeicRunQuestionStatus.SELECTED
          : Boolean(question.selectedKey)),
    )
  );
}
