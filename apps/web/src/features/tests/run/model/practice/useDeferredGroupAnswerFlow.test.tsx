import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ToeicQuestion } from "@/entities/toeic/api/types";
import type { PracticeSessionController } from "@/features/tests/run/model/practice/practiceSessionController";
import { useDeferredGroupAnswerFlow } from "@/features/tests/run/model/practice/useDeferredGroupAnswerFlow";
import type { PracticeGroup } from "@/features/tests/run/lib/practiceGroups";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

function createQuestion(id: number): ToeicQuestion {
  return {
    id,
    questionNumber: id,
    sessionQuestionNumber: id,
    question: `Question ${id}`,
    questionVi: null,
    options: {
      A: "Alpha",
      B: "Beta",
      C: "Charlie",
      D: "Delta",
      A_vi: null,
      B_vi: null,
      C_vi: null,
      D_vi: null,
    },
    optionCount: 4,
    answerKey: "A",
    selectedKey: null,
    status: null,
    isCorrect: null,
  };
}

function createDeferredGroup(questions: ToeicQuestion[]): PracticeGroup {
  return {
    group: {
      id: 10,
      partNumber: 3,
      questionStart: questions[0]?.questionNumber ?? 0,
      questionEnd: questions.at(-1)?.questionNumber ?? 0,
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
    },
    questions,
  };
}

describe("useDeferredGroupAnswerFlow", () => {
  it("queues every selection and grades the group locally before sync finishes", () => {
    const questions = [createQuestion(101), createQuestion(102)];
    const answers = new Map(questions.map((question) => [question.id, question]));
    const pendingQuestionIds = new Set<number>();
    const selectAnswer = vi.fn(
      (
        questionId: number,
        selectedKey: OptionKey,
      ) => {
        const answer = answers.get(questionId);
        if (answer) {
          answer.selectedKey = selectedKey;
          answer.status = "selected";
        }
        pendingQuestionIds.add(questionId);
      },
    );
    const gradeGroupLocally = vi.fn(
      (
        entries: Array<{
          toeicQuestionId: number;
          selectedKey: OptionKey;
        }>,
      ) => {
        for (const entry of entries) {
          const answer = answers.get(entry.toeicQuestionId);
          if (!answer) {
            continue;
          }

          answer.selectedKey = entry.selectedKey;
          answer.status = entry.selectedKey === answer.answerKey ? "right" : "wrong";
          answer.isCorrect = entry.selectedKey === answer.answerKey;
        }
      },
    );
    const practice = {
      gradeGroupLocally,
      getAnswer: (questionId: number) => answers.get(questionId),
      isQuestionPending: (questionId: number) =>
        pendingQuestionIds.has(questionId),
      selectAnswer,
    } as unknown as PracticeSessionController;
    const practiceGroup = createDeferredGroup(questions);

    const { result } = renderHook(() =>
      useDeferredGroupAnswerFlow({
        practice,
        practiceGroup,
        usesDeferredGroupGrading: true,
      }),
    );

    act(() => {
      result.current.handleSelect(101, "A");
    });
    act(() => {
      result.current.handleSelect(101, "B");
    });
    act(() => {
      result.current.handleSelect(102, "C");
    });

    expect(selectAnswer).toHaveBeenNthCalledWith(1, 101, "A", {
      deferGrade: true,
      replace: false,
    });
    expect(selectAnswer).toHaveBeenNthCalledWith(2, 101, "B", {
      deferGrade: true,
      replace: true,
    });
    expect(selectAnswer).toHaveBeenNthCalledWith(3, 102, "C", {
      deferGrade: true,
      replace: false,
    });
    expect(gradeGroupLocally).toHaveBeenCalledWith([
      { toeicQuestionId: 101, selectedKey: "B" },
      { toeicQuestionId: 102, selectedKey: "C" },
    ]);

    expect(result.current.showGroupReveal).toBe(true);
    expect(result.current.isGroupPending).toBe(true);
    expect(pendingQuestionIds).toEqual(new Set([101, 102]));
  });

  it("grades only the remaining selectable questions in a mixed review group", () => {
    const questions = [createQuestion(101), createQuestion(102)];
    questions[0]!.selectedKey = "A";
    questions[0]!.status = "right";
    questions[0]!.isCorrect = true;
    const answers = new Map(questions.map((question) => [question.id, question]));
    const gradeGroupLocally = vi.fn(
      (
        entries: Array<{
          toeicQuestionId: number;
          selectedKey: OptionKey;
        }>,
      ) => {
        for (const entry of entries) {
          const answer = answers.get(entry.toeicQuestionId);
          if (!answer) {
            continue;
          }

          answer.selectedKey = entry.selectedKey;
          answer.status = entry.selectedKey === answer.answerKey ? "right" : "wrong";
          answer.isCorrect = entry.selectedKey === answer.answerKey;
        }
      },
    );
    const selectAnswer = vi.fn(
      (questionId: number, selectedKey: OptionKey) => {
        const answer = answers.get(questionId);
        if (answer) {
          answer.selectedKey = selectedKey;
          answer.status = "selected";
        }
      },
    );
    const practice = {
      gradeGroupLocally,
      getAnswer: (questionId: number) => answers.get(questionId),
      isQuestionPending: () => false,
      selectAnswer,
    } as unknown as PracticeSessionController;

    const { result } = renderHook(() =>
      useDeferredGroupAnswerFlow({
        practice,
        practiceGroup: createDeferredGroup(questions),
        usesDeferredGroupGrading: true,
      }),
    );

    act(() => {
      result.current.handleSelect(102, "B");
    });

    expect(selectAnswer).toHaveBeenCalledWith(102, "B", {
      deferGrade: true,
      replace: false,
    });
    expect(gradeGroupLocally).toHaveBeenCalledWith([
      { toeicQuestionId: 102, selectedKey: "B" },
    ]);
    expect(result.current.showGroupReveal).toBe(true);
  });
});
