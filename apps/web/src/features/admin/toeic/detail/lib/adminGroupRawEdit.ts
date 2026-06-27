import type { AdminGroupEditorState } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  parseAdminGroupRawEditDocument,
  serializeAdminGroupRawEditDocument,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditDocument";
import {
  parseAdminGroupRawEditTxt,
  serializeAdminGroupRawEditTxt,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditTxt";
import type {
  AdminGroupRawEditMode,
  AdminGroupRawEditParseResult,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditTypes";

export type { AdminGroupRawEditMode, AdminGroupRawEditParseResult };

export function serializeAdminGroupRawEdit(
  state: AdminGroupEditorState,
  partNumber: number,
  mode: AdminGroupRawEditMode,
): string {
  if (mode === "txt") {
    return serializeAdminGroupRawEditTxt(state, partNumber);
  }

  return serializeAdminGroupRawEditDocument(state, partNumber);
}

export function parseAdminGroupRawEdit(
  text: string,
  currentState: AdminGroupEditorState,
  partNumber: number,
  mode: AdminGroupRawEditMode,
): AdminGroupRawEditParseResult {
  if (mode === "txt") {
    return parseAdminGroupRawEditTxt(text, currentState, partNumber);
  }

  return parseAdminGroupRawEditDocument(text, currentState, partNumber);
}
