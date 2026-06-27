import type {
  AdminToeicGroupFields,
  AdminToeicQuestionFields,
} from "@/features/admin/toeic/api/types";

export type AdminToeicGroupEditorField = keyof AdminToeicGroupFields;
export type AdminToeicQuestionEditorField = keyof AdminToeicQuestionFields;

const ALL_GROUP_FIELDS = [
  "groupType",
  "accent",
  "content",
  "contentVi",
] as const satisfies ReadonlyArray<AdminToeicGroupEditorField>;

const HIDDEN_GROUP_FIELDS_BY_PART: Record<
  number,
  ReadonlyArray<AdminToeicGroupEditorField>
> = {
  1: ["groupType", "content", "contentVi"],
  2: ["groupType", "content", "contentVi"],
  5: ALL_GROUP_FIELDS,
  6: ["accent"],
  7: ["accent"],
};

const HIDDEN_QUESTION_FIELDS_BY_PART: Record<
  number,
  ReadonlyArray<AdminToeicQuestionEditorField>
> = {
  1: ["questionType", "question", "questionVi", "explanationVi"],
  2: ["questionType", "explanationVi"],
  3: ["questionType", "explanationVi"],
  4: ["questionType", "explanationVi"],
  5: ["questionType", "explanationVi"],
  6: ["questionType", "question", "questionVi", "explanationVi"],
  7: ["questionType", "explanationVi"],
};

export function isAdminToeicGroupEditorFieldVisible(
  partNumber: number,
  field: AdminToeicGroupEditorField,
) {
  return !HIDDEN_GROUP_FIELDS_BY_PART[partNumber]?.includes(field);
}

export function isAdminToeicQuestionEditorFieldVisible(
  partNumber: number,
  field: AdminToeicQuestionEditorField,
) {
  return !HIDDEN_QUESTION_FIELDS_BY_PART[partNumber]?.includes(field);
}
