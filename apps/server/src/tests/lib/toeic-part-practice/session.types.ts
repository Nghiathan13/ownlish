import type { ToeicPartPracticeSessionMode } from './session.response.types';

export type PartPracticeRunForResponse = {
  id: string;
  partNumber: number;
  totalRight: number;
  totalWrong: number;
};

export type PartPracticeAnswerForResponse = {
  id: string;
  toeicQuestionId: number;
  selectedKey: string;
  status: string;
};

export type FormatPartPracticeSessionResponseOptions = {
  mode?: ToeicPartPracticeSessionMode;
};
