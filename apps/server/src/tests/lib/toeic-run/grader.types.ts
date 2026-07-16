import type { ToeicQuestionOptionKey } from '../toeic-question-mapper';
import type { ToeicQuestion, ToeicRunQuestionStatus } from '@prisma/client';

export type SubmitToeicAnswerResponse = {
  graded: boolean;
  isCorrect?: boolean;
  answerKey?: ToeicQuestionOptionKey;
  correctOptionEn?: string | null;
  correctOptionVi?: string | null;
};

export type ToeicQuestionWithTestPart = ToeicQuestion & {
  group: {
    id: number;
    testPart: {
      testId: number;
      partNumber: number;
    };
  };
};

export type ToeicRunQuestionGradeState = {
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
};
