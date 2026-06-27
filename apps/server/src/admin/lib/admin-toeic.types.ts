export type AdminToeicGroupPatchResponse = {
  group: {
    id: number;
    groupType?: string | null;
    accent?: string | null;
    content?: string | null;
    contentVi?: string | null;
  };
};

export type AdminToeicQuestionPatchResponse = {
  question: {
    id: number;
    question?: string | null;
    questionVi?: string | null;
    questionType?: string | null;
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
    optionAVi?: string | null;
    optionBVi?: string | null;
    optionCVi?: string | null;
    optionDVi?: string | null;
    answerKey?: 'A' | 'B' | 'C' | 'D' | null;
    explanationVi?: string | null;
  };
};
