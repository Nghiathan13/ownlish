import type { ToeicQuestion } from '@prisma/client';

export type ToeicQuestionOptionKey = 'A' | 'B' | 'C' | 'D';

const OPTION_KEYS: ToeicQuestionOptionKey[] = ['A', 'B', 'C', 'D'];

export function isToeicQuestionOptionKey(
  value: string,
): value is ToeicQuestionOptionKey {
  return OPTION_KEYS.includes(value as ToeicQuestionOptionKey);
}

export function parseAnswerKey(
  value: string | null | undefined,
): ToeicQuestionOptionKey | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return isToeicQuestionOptionKey(normalized) ? normalized : null;
}

export function mapQuestionOptions(question: ToeicQuestion) {
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

export function getOptionText(
  question: ToeicQuestion,
  key: ToeicQuestionOptionKey,
) {
  const options = mapQuestionOptions(question);
  return options[key];
}

export function getOptionViText(
  question: ToeicQuestion,
  key: ToeicQuestionOptionKey,
) {
  const options = mapQuestionOptions(question);
  switch (key) {
    case 'A':
      return options.A_vi;
    case 'B':
      return options.B_vi;
    case 'C':
      return options.C_vi;
    case 'D':
      return options.D_vi;
  }
}

export function countOptions(question: ToeicQuestion) {
  if (question.optionD?.trim()) {
    return 4;
  }

  if (question.optionC?.trim()) {
    return 3;
  }

  return 0;
}
