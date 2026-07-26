import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ToeicQuestion, ToeicQuestionGroup } from "@/entities/toeic-runtime/model/presentation";
import { usePracticeLocalGrade } from "@/features/tests/run/model/practice/usePracticeLocalGrade";
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from "@/shared/lib/testing/reactQuery";

function createQuestion(
  id: number,
  answerKey: ToeicQuestion["answerKey"],
): ToeicQuestion {
  return {
    id,
    questionNumber: id,
    sessionQuestionNumber: id,
    question: `Question ${id}`,
    questionVi: null,
    options: {
      A: "Alpha",
      B: "Beta",
      C: null,
      D: null,
      A_vi: null,
      B_vi: null,
      C_vi: null,
      D_vi: null,
    },
    optionCount: 2,
    answerKey,
    selectedKey: null,
    status: null,
    isCorrect: null,
  };
}

describe("usePracticeLocalGrade", () => {
  it("grades from payload keys without treating a missing key as wrong", () => {
    const queryKey = ["practice-session", "session-id"] as const;
    const queryClient = createTestQueryClient();
    const questionWithoutAnswerKey = createQuestion(103, null);
    questionWithoutAnswerKey.selectedKey = "B";
    questionWithoutAnswerKey.status = "selected";
    const questions = [
      createQuestion(101, "A"),
      createQuestion(102, "B"),
      questionWithoutAnswerKey,
    ];
    const group: ToeicQuestionGroup = {
      id: 10,
      partNumber: 3,
      questionStart: 101,
      questionEnd: 103,
      groupStatus: null,
      groupType: null,
      accent: null,
      content: "Listen and answer.",
      contentVi: null,
      audioUrl: null,
      audioUrlExpiresAt: null,
      imageUrl: null,
      imageUrlExpiresAt: null,
      questions,
    };
    queryClient.setQueryData(queryKey, { groups: [group] });

    const { result } = renderHook(
      () =>
        usePracticeLocalGrade({
          queryKey,
          answerKeyMap: new Map([
            [101, "A"],
            [102, "B"],
          ]),
        }),
      { wrapper: createQueryClientWrapper(queryClient) },
    );

    act(() => {
      result.current.gradeGroupLocally([
        { toeicQuestionId: 101, selectedKey: "A" },
        { toeicQuestionId: 102, selectedKey: "A" },
        { toeicQuestionId: 103, selectedKey: "B" },
      ]);
    });

    const graded = queryClient.getQueryData<{ groups: ToeicQuestionGroup[] }>(
      queryKey,
    );
    expect(graded?.groups[0]?.questions).toMatchObject([
      { id: 101, selectedKey: "A", status: "right", isCorrect: true },
      { id: 102, selectedKey: "A", status: "wrong", isCorrect: false },
      { id: 103, selectedKey: "B", status: "selected", isCorrect: null },
    ]);
    expect(graded?.groups[0]?.groupStatus).toBeNull();
  });
});
