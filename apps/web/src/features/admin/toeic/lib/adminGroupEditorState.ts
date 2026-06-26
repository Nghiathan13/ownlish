import type { AdminToeicGroupRaw } from "@/features/admin/toeic/api/types";

export type AdminToeicGroupDraft = AdminToeicGroupRaw;

export function cloneAdminToeicGroupDraft(
  group: AdminToeicGroupRaw,
): AdminToeicGroupDraft {
  return {
    ...group,
    questions: group.questions.map((question) => ({ ...question })),
  };
}

export function isAdminToeicGroupDraftDirty(
  baseline: AdminToeicGroupRaw,
  draft: AdminToeicGroupDraft,
): boolean {
  return JSON.stringify(baseline) !== JSON.stringify(draft);
}

export function shouldShowAdminGroupEdit(isAdmin: boolean): boolean {
  return isAdmin;
}
