import type { ToeicQuestion, ToeicQuestionGroup } from "@/entities/toeic-runtime/model/presentation";

export type PracticeItem = {
  group: ToeicQuestionGroup;
  question: ToeicQuestion;
};

export type PracticeGroup = {
  group: ToeicQuestionGroup;
  questions: ToeicQuestion[];
};
