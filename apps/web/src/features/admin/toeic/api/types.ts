export type AdminToeicAnswerKey = "A" | "B" | "C" | "D" | null;

export type AdminToeicTestRawQuestion = {
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

export type AdminToeicGroupFields = {
  groupType: string | null;
  accent: string | null;
  content: string | null;
  contentVi: string | null;
};

export type AdminToeicQuestionFields = {
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

export type AdminToeicGroupPatchInput = Partial<AdminToeicGroupFields>;

export type AdminToeicQuestionPatchInput = Partial<AdminToeicQuestionFields>;

export type AdminToeicGroupPatchResponse = {
  group: {
    id: number;
  } & AdminToeicGroupPatchInput;
};

export type AdminToeicGroupImageDeleteResponse = {
  group: {
    id: number;
    imageUrl: null;
    imageUrlExpiresAt: null;
  };
};

export type AdminToeicGroupImageUploadResponse = {
  group: {
    id: number;
    imageUrl: string;
    imageUrlExpiresAt: string;
  };
};

export type AdminToeicGroupAudioDeleteResponse = {
  group: {
    id: number;
    audioUrl: null;
    audioUrlExpiresAt: null;
  };
};

export type AdminToeicGroupAudioUploadResponse = {
  group: {
    id: number;
    audioUrl: string;
    audioUrlExpiresAt: string;
  };
};

export type AdminToeicQuestionPatchResponse = {
  question: {
    id: number;
  } & AdminToeicQuestionPatchInput;
};

export type AdminToeicTestPartSummary = {
  partNumber: number;
  groupCount: number;
  questionCount: number;
};

export type AdminToeicTestListItem = {
  id: number;
  year: number;
  testNumber: number;
  parts: AdminToeicTestPartSummary[];
};

export type AdminToeicTestListResponse = {
  items: AdminToeicTestListItem[];
};

export type AdminToeicTestRawGroup = {
  id: number;
  questionStart: number;
  questionEnd: number;
  groupType: string | null;
  accent: string | null;
  content: string | null;
  contentVi: string | null;
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
  questions: AdminToeicTestRawQuestion[];
};

export type AdminToeicTestRawPart = {
  partNumber: number;
  groups: AdminToeicTestRawGroup[];
};

export type AdminToeicTestRawResponse = {
  test: {
    id: number;
    year: number;
    testNumber: number;
  };
  parts: AdminToeicTestRawPart[];
};
