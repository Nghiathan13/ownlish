"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { AdminToeicPartSection } from "@/features/admin/toeic/detail/components/AdminToeicPartSection";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import {
  getAdminToeicTestDetailQueryKey,
  useAdminToeicTestDetailQuery,
} from "@/features/admin/toeic/detail/hooks/useAdminToeicTestDetailQuery";
import { replaceGroupInTestDetail } from "@/features/admin/toeic/detail/lib/mergeGroupIntoDetailCache";
import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type AdminToeicTestDetailPageProps = {
  testId: number;
};

export function AdminToeicTestDetailPage({ testId }: AdminToeicTestDetailPageProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useAdminToeicTestDetailQuery({
    enabled: true,
    testId,
  });
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [dirtyGroupId, setDirtyGroupId] = useState<number | null>(null);
  const [pendingEditGroupId, setPendingEditGroupId] = useState<number | null>(
    null,
  );

  const handleRequestEdit = useCallback(
    (groupId: number) => {
      if (editingGroupId === groupId) {
        return;
      }

      if (
        editingGroupId != null &&
        dirtyGroupId === editingGroupId &&
        editingGroupId !== groupId
      ) {
        setPendingEditGroupId(groupId);
        return;
      }

      setEditingGroupId(groupId);
    },
    [dirtyGroupId, editingGroupId],
  );

  const handleExitEdit = useCallback(() => {
    setEditingGroupId(null);
    setDirtyGroupId(null);
  }, []);

  const handleDirtyChange = useCallback(
    (groupId: number, isDirty: boolean) => {
      if (!isDirty && dirtyGroupId === groupId) {
        setDirtyGroupId(null);
        return;
      }

      if (isDirty) {
        setDirtyGroupId(groupId);
      }
    },
    [dirtyGroupId],
  );

  const handleSaved = useCallback(
    (updatedGroup: AdminToeicTestRawGroup) => {
      queryClient.setQueryData<AdminToeicTestRawResponse>(
        getAdminToeicTestDetailQueryKey(testId),
        (current) =>
          current ? replaceGroupInTestDetail(current, updatedGroup) : current,
      );
      setDirtyGroupId(null);
    },
    [queryClient, testId],
  );

  const handleConfirmSwitch = useCallback(() => {
    if (pendingEditGroupId == null) {
      return;
    }

    setEditingGroupId(pendingEditGroupId);
    setDirtyGroupId(null);
    setPendingEditGroupId(null);
  }, [pendingEditGroupId]);

  return (
    <PageShell>
      <Panel>
        <div className="flex flex-col gap-6">
          <div>
            <Link
              className={secondaryTextButtonClassName()}
              href="/admin/toeic"
            >
              Back to TOEIC Content
            </Link>
            {data ? (
              <>
                <h1 className="mt-4 text-3xl font-bold leading-tight">
                  Test {data.test.testNumber} · {data.test.year}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Test ID {data.test.id}
                </p>
              </>
            ) : (
              <h1 className="mt-4 text-3xl font-bold leading-tight">
                TOEIC Test
              </h1>
            )}
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading test content…</p>
          ) : error ? (
            <p className="text-muted-foreground">Cannot load this test.</p>
          ) : data == null ? (
            <p className="text-muted-foreground">Test not found.</p>
          ) : (
            <div className="flex flex-col gap-8">
              {data.parts.map((part) => (
                <AdminToeicPartSection
                  editingGroupId={editingGroupId}
                  key={part.partNumber}
                  onDirtyChange={handleDirtyChange}
                  onExitEdit={handleExitEdit}
                  onRequestEdit={handleRequestEdit}
                  onSaved={handleSaved}
                  part={part}
                />
              ))}
            </div>
          )}
        </div>
      </Panel>

      {pendingEditGroupId != null ? (
        <AdminConfirmDialog
          confirmLabel="Discard and continue"
          description="The current group has unsaved changes. Discard them and edit another group?"
          onClose={() => setPendingEditGroupId(null)}
          onConfirm={handleConfirmSwitch}
          title="Discard changes?"
        />
      ) : null}
    </PageShell>
  );
}
