import type { QueryClient } from "@tanstack/react-query";
import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";
import { getAdminToeicTestDetailQueryKey } from "@/features/admin/toeic/detail/hooks/useAdminToeicTestDetailQuery";
import { replaceGroupInTestDetail } from "@/features/admin/toeic/detail/lib/applyAdminEditsToCache";

export function mergeAdminToeicGroupPatchIntoDetailCache(
  queryClient: QueryClient,
  testId: number,
  updatedGroup: AdminToeicTestRawGroup,
) {
  queryClient.setQueryData<AdminToeicTestRawResponse>(
    getAdminToeicTestDetailQueryKey(testId),
    (current) =>
      current ? replaceGroupInTestDetail(current, updatedGroup) : current,
  );
}
