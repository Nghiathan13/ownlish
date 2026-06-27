import { describe, expect, it, vi } from "vitest";
import type { AdminToeicTestRawResponse } from "@/features/admin/toeic/api/types";
import { getAdminToeicTestDetailQueryKey } from "@/features/admin/toeic/detail/hooks/useAdminToeicTestDetailQuery";
import { mergeAdminToeicGroupPatchIntoDetailCache } from "@/features/admin/toeic/detail/lib/adminToeicGroupPatchCache";

const testDetail: AdminToeicTestRawResponse = {
  test: { id: 10, testNumber: 1, year: 2024 },
  parts: [
    {
      partNumber: 1,
      groups: [
        {
          id: 100,
          groupType: "photo",
          accent: null,
          content: "Old",
          contentVi: null,
          audioUrl: null,
          audioUrlExpiresAt: null,
          imageUrl: null,
          imageUrlExpiresAt: null,
          questionStart: 1,
          questionEnd: 1,
          questions: [
            {
              id: 1,
              questionNumber: 1,
              question: "Q1",
              questionVi: null,
              questionType: null,
              optionA: "A",
              optionB: "B",
              optionC: "C",
              optionD: "D",
              optionAVi: null,
              optionBVi: null,
              optionCVi: null,
              optionDVi: null,
              answerKey: "A",
              explanationVi: null,
            },
          ],
        },
      ],
    },
  ],
};

describe("mergeAdminToeicGroupPatchIntoDetailCache", () => {
  it("merges the patched group into the detail query cache only", () => {
    const updatedGroup = {
      ...testDetail.parts[0]!.groups[0]!,
      content: "New",
    };
    const setQueryData = vi.fn();
    const queryClient = { setQueryData } as never;

    mergeAdminToeicGroupPatchIntoDetailCache(queryClient, 10, updatedGroup);

    expect(setQueryData).toHaveBeenCalledOnce();
    expect(setQueryData).toHaveBeenCalledWith(
      getAdminToeicTestDetailQueryKey(10),
      expect.any(Function),
    );

    const updater = setQueryData.mock.calls[0]?.[1] as (
      current: AdminToeicTestRawResponse,
    ) => AdminToeicTestRawResponse;
    const next = updater(testDetail);

    expect(next.parts[0]?.groups[0]?.content).toBe("New");
  });
});
