"use client";

import { useCallback, useMemo, useState } from "react";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { patchAdminToeicGroupRaw } from "@/features/admin/toeic/api/adminToeicGroup";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import {
  cloneAdminToeicGroupDraft,
  createDraftFromTestRawGroup,
  isAdminToeicGroupDraftDirty,
  toAdminToeicGroupPatchInput,
  type AdminToeicGroupDraft,
} from "@/features/admin/toeic/detail/lib/adminGroupDraft";
import { mergeGroupIntoDetailCache } from "@/features/admin/toeic/detail/lib/mergeGroupIntoDetailCache";
import { ApiError } from "@/shared/api/http";

type UseAdminGroupEditorParams = {
  group: AdminToeicTestRawGroup;
  onSaved: (updatedGroup: AdminToeicTestRawGroup) => void;
};

export function useAdminGroupEditor({
  group,
  onSaved,
}: UseAdminGroupEditorParams) {
  const baseline = useMemo(
    () => createDraftFromTestRawGroup(group),
    [group],
  );
  const [draft, setDraft] = useState<AdminToeicGroupDraft>(() =>
    cloneAdminToeicGroupDraft(baseline),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = isAdminToeicGroupDraftDirty(baseline, draft);

  const resetDraft = useCallback(() => {
    setDraft(cloneAdminToeicGroupDraft(baseline));
    setError(null);
  }, [baseline]);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = await runAuthenticatedRequest({
        request: (token) =>
          patchAdminToeicGroupRaw(
            token,
            group.id,
            toAdminToeicGroupPatchInput(draft),
          ),
      });
      const updatedGroup = mergeGroupIntoDetailCache(group, payload.group);
      onSaved(updatedGroup);
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Failed to save group data.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [draft, group, onSaved]);

  return {
    draft,
    setDraft,
    isDirty,
    isSaving,
    error,
    resetDraft,
    save,
  };
}
