import { ToeicRunGroupStatus, ToeicRunQuestionStatus } from '@prisma/client';
import type {
  ToeicSessionGroupStatusResponse,
  ToeicSessionQuestionStatusResponse,
} from './session.response.types';

export function formatToeicGroupStatus(
  status: ToeicRunGroupStatus | null,
): ToeicSessionGroupStatusResponse {
  if (status === ToeicRunGroupStatus.RIGHT) {
    return 'right';
  }

  if (status === ToeicRunGroupStatus.WRONG) {
    return 'wrong';
  }

  return null;
}

export function formatToeicQuestionStatus(
  status: ToeicRunQuestionStatus | null,
): ToeicSessionQuestionStatusResponse {
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
