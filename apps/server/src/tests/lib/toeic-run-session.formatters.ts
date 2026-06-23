import {
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
} from '@prisma/client';
import type {
  ToeicRunGroupForResponse,
  ToeicSessionResponseMode,
} from './toeic-run-session.types';

export function formatToeicRunMode(mode: ToeicRunMode): ToeicSessionResponseMode {
  if (mode === ToeicRunMode.MOCK_TEST) {
    return 'mock_test';
  }

  return 'practice';
}

export function isWrongReviewToeicGroup(group: ToeicRunGroupForResponse) {
  return (
    group.status === ToeicRunGroupStatus.WRONG ||
    group.questions.some(
      (question) => question.status === ToeicRunQuestionStatus.WRONG,
    )
  );
}

export function formatToeicGroupStatus(status: ToeicRunGroupStatus | null) {
  if (status === ToeicRunGroupStatus.RIGHT) {
    return 'right';
  }

  if (status === ToeicRunGroupStatus.WRONG) {
    return 'wrong';
  }

  return null;
}

export function formatToeicQuestionStatus(status: ToeicRunQuestionStatus | null) {
  if (status === ToeicRunQuestionStatus.SELECTED) {
    return 'selected';
  }

  if (status === ToeicRunQuestionStatus.RIGHT) {
    return 'right';
  }

  if (status === ToeicRunQuestionStatus.WRONG) {
    return 'wrong';
  }

  return null;
}

export function formatToeicQuestionCorrectness(
  status: ToeicRunQuestionStatus | null,
) {
  if (status === ToeicRunQuestionStatus.RIGHT) {
    return true;
  }

  if (status === ToeicRunQuestionStatus.WRONG) {
    return false;
  }

  return null;
}
