import type { ToeicRunMode } from '@prisma/client';

export type CreateToeicRunWithQuestionsInput = {
  userId: string;
  testId: number;
  mode: ToeicRunMode;
  selectedParts: number[];
};

export type ToeicQuestionGroupForRun = {
  id: number;
  questionStart: number;
  questionEnd: number;
  testPart: {
    partNumber: number;
  };
  questions: Array<{
    id: number;
    questionNumber: number;
  }>;
};
