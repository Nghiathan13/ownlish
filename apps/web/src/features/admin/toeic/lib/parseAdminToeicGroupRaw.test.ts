import { describe, expect, it } from "vitest";
import { parseAdminToeicGroupRawPayload } from "@/features/admin/toeic/lib/parseAdminToeicGroupRaw";

const validPayload = {
  group: {
    id: 101,
    testId: 5,
    partNumber: 4,
    questionStart: 1,
    questionEnd: 3,
    groupType: "single",
    accent: "us",
    content: "Passage",
    contentVi: "Đoạn văn",
    audioStoragePath: "toeic/audio/test.mp3",
    imageStoragePath: null,
    questions: [
      {
        id: 1001,
        questionNumber: 1,
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
};

describe("parseAdminToeicGroupRawPayload", () => {
  it("parses valid raw group payload", () => {
    expect(parseAdminToeicGroupRawPayload(validPayload)).toEqual(validPayload);
  });

  it("rejects invalid answerKey", () => {
    expect(() =>
      parseAdminToeicGroupRawPayload({
        group: {
          ...validPayload.group,
          questions: [
            {
              ...validPayload.group.questions[0],
              answerKey: "E",
            },
          ],
        },
      }),
    ).toThrow();
  });
});
