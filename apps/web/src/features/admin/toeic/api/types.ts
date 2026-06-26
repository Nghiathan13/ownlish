export type AdminToeicAnswerKey = "A" | "B" | "C" | "D" | null;

export type AdminToeicGroupRawQuestion = {
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
  answerKey: AdminToeicAnswerKey;
  explanationVi: string | null;
};

export type AdminToeicGroupRaw = {
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
  questions: AdminToeicGroupRawQuestion[];
};

export type AdminToeicGroupRawPayload = {
  group: AdminToeicGroupRaw;
};

export type AdminToeicGroupRawPatchInput = {
  group: {
    groupType: string | null;
    accent: string | null;
    content: string | null;
    contentVi: string | null;
  };
  questions: Array<{
    id: number;
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
    answerKey: AdminToeicAnswerKey;
    explanationVi: string | null;
  }>;
};
