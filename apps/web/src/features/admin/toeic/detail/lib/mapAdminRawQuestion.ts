import type { AdminToeicTestRawQuestion } from "@/features/admin/toeic/api/types";
import type { ToeicQuestionOptions } from "@/entities/toeic/api/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function mapAdminRawQuestionToOptions(
  question: AdminToeicTestRawQuestion,
): ToeicQuestionOptions {
  return {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
    A_vi: question.optionAVi,
    B_vi: question.optionBVi,
    C_vi: question.optionCVi,
    D_vi: question.optionDVi,
  };
}

export function getAdminRawQuestionOptionCount(
  question: AdminToeicTestRawQuestion,
): number {
  const filledCount = OPTION_KEYS.filter((key) => {
    const value = question[`option${key}` as keyof AdminToeicTestRawQuestion];
    return typeof value === "string" && value.trim().length > 0;
  }).length;

  return filledCount > 0 ? filledCount : 4;
}
