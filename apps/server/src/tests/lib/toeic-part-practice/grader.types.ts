import type { ToeicQuestionOptionKey } from '../toeic-question-mapper';
import type { ToeicQuestion, ToeicRunQuestionStatus } from '@prisma/client';

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

export type PartPracticeRunQuestionWithQuestion = {
  id: string;
  runId: string;
  runGroupId: string;
  toeicQuestionId: number;
  partNumber: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: ToeicQuestion;
};
