import type { AdminGroupEditorState } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";

export type AdminGroupRawEditMode = "txt" | "json";

export type AdminGroupRawEditParseResult =
  | { ok: true; state: AdminGroupEditorState }
  | { ok: false; error: string };
