import { describe, expect, it, vi } from "vitest";
import { parseToeicSessionResult } from "./parseToeicSessionResult";

vi.mock("../../../../shared/api/http", () => ({
  invalidApiResponse: () => {
    throw new Error("Invalid server response.");
  },
}));

describe("parseToeicSessionResult", () => {
  it("parses mock test sessions with question state inside groups", () => {
    expect(
      parseToeicSessionResult({
        sessionId: "session-id",
        mode: "mock_test",
        testId: 1,
        partNumbers: [1],
        totalQuestions: 1,
        correctCount: 1,
        wrongCount: 0,
        completedAt: "2026-06-21T00:00:00.000Z",
        groups: [
          {
            id: 101,
            partNumber: 1,
            questionStart: 1,
            questionEnd: 1,
            groupStatus: "right",
            groupType: "photo",
            accent: null,
            content: null,
            contentVi: null,
            audioUrl: null,
            audioUrlExpiresAt: null,
            imageUrl: null,
            imageUrlExpiresAt: null,
            questions: [
              {
                id: 1001,
                questionNumber: 1,
                sessionQuestionNumber: 1,
                question: null,
                questionVi: null,
                options: {
                  A: "A",
                  B: "B",
                  C: "C",
                  D: "D",
                  A_vi: null,
                  B_vi: null,
                  C_vi: null,
                  D_vi: null,
                },
                optionCount: 4,
                answerKey: "A",
                selectedKey: "A",
                status: "right",
                isCorrect: true,
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      sessionId: "session-id",
      mode: "mock_test",
      totalQuestions: 1,
      completedAt: "2026-06-21T00:00:00.000Z",
      groups: [
        {
          groupStatus: "right",
          questions: [
            {
              sessionQuestionNumber: 1,
              selectedKey: "A",
              status: "right",
              isCorrect: true,
            },
          ],
        },
      ],
    });
  });
});
