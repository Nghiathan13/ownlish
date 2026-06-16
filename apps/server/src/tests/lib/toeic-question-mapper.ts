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
  const viKey = `${key}_vi` as 'A_vi' | 'B_vi' | 'C_vi' | 'D_vi';
  return mapQuestionOptions(question)[viKey];
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
