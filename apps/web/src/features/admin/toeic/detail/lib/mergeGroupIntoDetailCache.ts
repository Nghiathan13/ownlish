import type {
  AdminToeicGroupRaw,
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";

export function mergeGroupIntoDetailCache(
  previous: AdminToeicTestRawGroup,
  saved: AdminToeicGroupRaw,
): AdminToeicTestRawGroup {
  return {
    id: previous.id,
    questionStart: previous.questionStart,
    questionEnd: previous.questionEnd,
    groupType: saved.groupType,
    accent: saved.accent,
    content: saved.content,
    contentVi: saved.contentVi,
    audioUrl: previous.audioUrl,
    audioUrlExpiresAt: previous.audioUrlExpiresAt,
    imageUrl: previous.imageUrl,
    imageUrlExpiresAt: previous.imageUrlExpiresAt,
    questions: saved.questions,
  };
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
