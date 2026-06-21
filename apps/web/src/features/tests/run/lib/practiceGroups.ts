import type { ToeicQuestion, ToeicQuestionGroup } from "@/features/tests/shared/api/types";

export type PracticeItem = {
  group: ToeicQuestionGroup;
  question: ToeicQuestion;
};

export type PracticeGroup = {
  group: ToeicQuestionGroup;
  questions: ToeicQuestion[];
};
