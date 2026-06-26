export type ToeicGroupRawQuestionResponse = {
  id: number;
  questionNumber: number;
  question: string | null;
  questionVi: string | null;
  questionType: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionAVi: string | null;
  optionBVi: string | null;
  optionCVi: string | null;
  optionDVi: string | null;
  answerKey: 'A' | 'B' | 'C' | 'D' | null;
  explanationVi: string | null;
};

export type ToeicGroupRawResponse = {
  id: number;
  testId: number;
  partNumber: number;
  questionStart: number;
  questionEnd: number;
  groupType: string | null;
  accent: string | null;
  content: string | null;
  contentVi: string | null;
  audioStoragePath: string | null;
  imageStoragePath: string | null;
  questions: ToeicGroupRawQuestionResponse[];
};

export type ToeicGroupRawPayload = {
  group: ToeicGroupRawResponse;
};
