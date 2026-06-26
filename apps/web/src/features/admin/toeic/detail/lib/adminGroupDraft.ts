import type {
  AdminToeicGroupRawPatchInput,
  AdminToeicGroupRawQuestion,
  AdminToeicTestRawGroup,
} from "@/features/admin/toeic/api/types";

export type AdminToeicGroupDraft = {
  id: number;
  questionStart: number;
  questionEnd: number;
  groupType: string | null;
  accent: string | null;
  content: string | null;
  contentVi: string | null;
  questions: AdminToeicGroupRawQuestion[];
};

export function createDraftFromTestRawGroup(
  group: AdminToeicTestRawGroup,
): AdminToeicGroupDraft {
  return {
    id: group.id,
    questionStart: group.questionStart,
    questionEnd: group.questionEnd,
    groupType: group.groupType,
    accent: group.accent,
    content: group.content,
    contentVi: group.contentVi,
    questions: group.questions.map((question) => ({ ...question })),
  };
}

export function cloneAdminToeicGroupDraft(
  draft: AdminToeicGroupDraft,
): AdminToeicGroupDraft {
  return {
    ...draft,
    questions: draft.questions.map((question) => ({ ...question })),
  };
}

export function isAdminToeicGroupDraftDirty(
  baseline: AdminToeicGroupDraft,
  draft: AdminToeicGroupDraft,
): boolean {
  return JSON.stringify(baseline) !== JSON.stringify(draft);
}

export function toAdminToeicGroupPatchInput(
  draft: AdminToeicGroupDraft,
): AdminToeicGroupRawPatchInput {
  return {
    group: {
      groupType: draft.groupType,
      accent: draft.accent,
      content: draft.content,
      contentVi: draft.contentVi,
    },
    questions: draft.questions.map((question) => ({
      id: question.id,
      question: question.question,
      questionVi: question.questionVi,
      questionType: question.questionType,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionAVi: question.optionAVi,
      optionBVi: question.optionBVi,
      optionCVi: question.optionCVi,
      optionDVi: question.optionDVi,
      answerKey: question.answerKey,
      explanationVi: question.explanationVi,
    })),
  };
}
