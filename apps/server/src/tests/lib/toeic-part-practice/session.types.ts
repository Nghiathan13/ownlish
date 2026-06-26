import {
  ToeicRunGroupStatus,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
} from '@prisma/client';
import type { ToeicPartPracticeSessionMode } from './session.response.types';

export type PartPracticeRunQuestionForResponse = {
  toeicQuestionId: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: { answerKey: string | null };
};

export type PartPracticeRunQuestionWithQuestionForResponse = {
  toeicQuestionId: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: ToeicQuestion;
};

export type PartPracticeRunGroupForResponse = {
  toeicQuestionGroupId: number;
  toeicTestId: number;
  partNumber: number;
  questionStart: number;
  questionEnd: number;
  sortOrder: number;
  status: ToeicRunGroupStatus | null;
  test: {
    year: number;
    testNumber: number;
  };
  toeicQuestionGroup: {
    id: number;
    groupType: string | null;
    accent: string | null;
    content: string | null;
    contentVi: string | null;
    audioStoragePath: string | null;
    imageStoragePath: string | null;
  };
  questions: PartPracticeRunQuestionWithQuestionForResponse[];
};

export type PartPracticeRunForResponse = {
  id: string;
  partNumber: number;
  totalRight: number;
  totalWrong: number;
  questions: PartPracticeRunQuestionForResponse[];
  groups: PartPracticeRunGroupForResponse[];
};

export type FormatPartPracticeSessionResponseOptions = {
  mode?: ToeicPartPracticeSessionMode;
  groupFilter?: (group: PartPracticeRunGroupForResponse) => boolean;
};
