import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import {
  isAdminToeicGroupEditorFieldVisible,
  type AdminToeicGroupEditorField,
} from "@/features/admin/toeic/detail/lib/adminToeicEditorVisibility";

export function formatAdminRawMetadataLabel(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed);
    }
  } catch {
    // Keep stored scalar values as-is.
  }

  return trimmed;
}

export function getAdminRawMetadataLines(
  group: Pick<AdminToeicTestRawGroup, "groupType" | "accent">,
  partNumber: number,
): string[] {
  const fields: AdminToeicGroupEditorField[] = ["groupType", "accent"];
  const lines: string[] = [];

  for (const field of fields) {
    if (!isAdminToeicGroupEditorFieldVisible(partNumber, field)) {
      continue;
    }

    const label = formatAdminRawMetadataLabel(
      field === "groupType" ? group.groupType : group.accent,
    );

    if (label) {
      lines.push(label);
    }
  }

  return lines;
}
