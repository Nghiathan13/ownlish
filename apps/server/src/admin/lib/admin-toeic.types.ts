export type AdminToeicGroupPatchResponse = {
  group: {
    id: number;
    groupType?: string | null;
    accent?: string | null;
    content?: string | null;
    contentVi?: string | null;
  };
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
