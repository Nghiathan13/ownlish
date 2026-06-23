import {
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
} from '@prisma/client';

export type ToeicSessionResponseMode = 'practice' | 'review_wrong' | 'mock_test';

export type ToeicRunQuestionForResponse = {
  toeicQuestionId: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: { answerKey: string | null };
};

export type ToeicRunQuestionWithQuestionForResponse = {
  toeicQuestionId: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: ToeicQuestion;
};

export type ToeicRunGroupForResponse = {
  toeicQuestionGroupId: number;
  partNumber: number;
  questionStart: number;
  questionEnd: number;
  sortOrder: number;
  status: ToeicRunGroupStatus | null;
  toeicQuestionGroup: {
    id: number;
    groupType: string | null;
    accent: string | null;
    content: string | null;
    contentVi: string | null;
    audioStoragePath: string | null;
    imageStoragePath: string | null;
  };
  questions: ToeicRunQuestionWithQuestionForResponse[];
};

export type ToeicRunForResponse = {
  id: string;
  mode: ToeicRunMode;
  toeicTestId: number;
  selectedParts: number[];
  totalRight: number;
  totalWrong: number;
  completedAt: Date | null;
  questions: ToeicRunQuestionForResponse[];
  groups: ToeicRunGroupForResponse[];
};

export type FormatToeicSessionResponseOptions = {
  mode?: ToeicSessionResponseMode;
  groupFilter?: (group: ToeicRunGroupForResponse) => boolean;
};
