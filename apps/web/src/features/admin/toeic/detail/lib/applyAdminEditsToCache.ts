import type {
  AdminToeicGroupPatchResponse,
  AdminToeicQuestionPatchResponse,
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";

export function applyAdminEditsToCache(
  previous: AdminToeicTestRawGroup,
  edits: {
    group?: AdminToeicGroupPatchResponse["group"];
    questions?: AdminToeicQuestionPatchResponse["question"][];
  },
): AdminToeicTestRawGroup {
  const nextGroup: AdminToeicTestRawGroup = {
    ...previous,
    questions: [...previous.questions],
  };

  if (edits.group) {
    const savedGroup = edits.group;

    if (savedGroup.groupType !== undefined) {
      nextGroup.groupType = savedGroup.groupType;
    }
    if (savedGroup.accent !== undefined) {
      nextGroup.accent = savedGroup.accent;
    }
    if (savedGroup.content !== undefined) {
      nextGroup.content = savedGroup.content;
    }
    if (savedGroup.contentVi !== undefined) {
      nextGroup.contentVi = savedGroup.contentVi;
    }
  }

  if (edits.questions) {
    for (const savedQuestion of edits.questions) {
      const index = nextGroup.questions.findIndex(
        (question) => question.id === savedQuestion.id,
      );

      if (index < 0) {
        continue;
      }

      const current = nextGroup.questions[index];
      nextGroup.questions[index] = {
        ...current,
        ...(savedQuestion.question !== undefined
          ? { question: savedQuestion.question }
          : {}),
        ...(savedQuestion.questionVi !== undefined
          ? { questionVi: savedQuestion.questionVi }
          : {}),
        ...(savedQuestion.questionType !== undefined
          ? { questionType: savedQuestion.questionType }
          : {}),
        ...(savedQuestion.optionA !== undefined
          ? { optionA: savedQuestion.optionA }
          : {}),
        ...(savedQuestion.optionB !== undefined
          ? { optionB: savedQuestion.optionB }
          : {}),
        ...(savedQuestion.optionC !== undefined
          ? { optionC: savedQuestion.optionC }
          : {}),
        ...(savedQuestion.optionD !== undefined
          ? { optionD: savedQuestion.optionD }
          : {}),
        ...(savedQuestion.optionAVi !== undefined
          ? { optionAVi: savedQuestion.optionAVi }
          : {}),
        ...(savedQuestion.optionBVi !== undefined
          ? { optionBVi: savedQuestion.optionBVi }
          : {}),
        ...(savedQuestion.optionCVi !== undefined
          ? { optionCVi: savedQuestion.optionCVi }
          : {}),
        ...(savedQuestion.optionDVi !== undefined
          ? { optionDVi: savedQuestion.optionDVi }
          : {}),
        ...(savedQuestion.answerKey !== undefined
          ? { answerKey: savedQuestion.answerKey }
          : {}),
        ...(savedQuestion.explanationVi !== undefined
          ? { explanationVi: savedQuestion.explanationVi }
          : {}),
      };
    }
  }

  return nextGroup;
}

export function replaceGroupInTestDetail(
  data: AdminToeicTestRawResponse,
  updatedGroup: AdminToeicTestRawGroup,
): AdminToeicTestRawResponse {
  return {
    ...data,
    parts: data.parts.map((part) => ({
      ...part,
      groups: part.groups.map((group) =>
        group.id === updatedGroup.id ? updatedGroup : group,
      ),
    })),
  };
}
