import type { ToeicQuestion, ToeicQuestionGroup } from "@/entities/toeic-runtime";

export type PracticeItem = {
  group: ToeicQuestionGroup;
  question: ToeicQuestion;
};

export type PracticeGroup = {
  group: ToeicQuestionGroup;
  questions: ToeicQuestion[];
};
