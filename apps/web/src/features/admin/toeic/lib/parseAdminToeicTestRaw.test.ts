import { describe, expect, it } from "vitest";
import { parseAdminToeicTestRawResponse } from "@/features/admin/toeic/lib/parseAdminToeicTestRaw";

const validPayload = {
  test: { id: 5, year: 2026, testNumber: 1 },
  parts: [
    {
      partNumber: 5,
      groups: [
        {
          id: 101,
          questionStart: 101,
          questionEnd: 103,
          groupType: "single",
          accent: "us",
          content: "Passage",
          contentVi: "Đoạn văn",
          audioUrl: "https://signed.example/audio.mp3",
          audioUrlExpiresAt: "2026-06-26T12:00:00.000Z",
          imageUrl: null,
          imageUrlExpiresAt: null,
          questions: [
            {
              id: 1001,
              questionNumber: 101,
              question: "Q1",
              questionVi: "C1",
              questionType: "mcq",
              optionA: "A1",
              optionB: "B1",
              optionC: "C1",
              optionD: "D1",
              optionAVi: "A1 vi",
              optionBVi: "B1 vi",
              optionCVi: "C1 vi",
              optionDVi: "D1 vi",
              answerKey: "A",
              explanationVi: "Explain",
            },
          ],
        },
      ],
    },
  ],
};

describe("parseAdminToeicTestRawResponse", () => {
  it("parses valid raw test payload", () => {
    expect(parseAdminToeicTestRawResponse(validPayload)).toEqual(validPayload);
  });

  it("rejects invalid answerKey", () => {
    expect(() =>
      parseAdminToeicTestRawResponse({
        ...validPayload,
        parts: [
          {
            ...validPayload.parts[0],
            groups: [
              {
                ...validPayload.parts[0].groups[0],
                questions: [
                  {
                    ...validPayload.parts[0].groups[0].questions[0],
                    answerKey: "Z",
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toThrow();
  });
});
