import type { ToeicQuestionOptionKey } from '../toeic-question-mapper';
import type { ToeicQuestion } from '@prisma/client';

export type SubmitPartPracticeAnswerResponse = {
  graded: boolean;
  isCorrect?: boolean;
  answerKey?: ToeicQuestionOptionKey;
  correctOptionEn?: string | null;
  correctOptionVi?: string | null;
};

export type PartPracticeQuestionWithTestPart = ToeicQuestion & {
  group: {
    id: number;
    testPart: {
      testId: number;
      partNumber: number;
    };
  };
};
