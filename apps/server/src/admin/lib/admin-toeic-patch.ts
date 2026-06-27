import { BadRequestException } from '@nestjs/common';
import type { PatchToeicGroupDto } from '../dto/patch-toeic-group.dto';
import type { PatchToeicQuestionDto } from '../dto/patch-toeic-question.dto';
import {
  isValidAnswerKey,
  normalizeAnswerKey,
  normalizeNullableString,
} from './toeic-group-raw.normalize';

export function getPatchDtoKeys<T extends object>(dto: T): Array<keyof T> {
  return (Object.keys(dto) as Array<keyof T>).filter(
    (key) => dto[key] !== undefined,
  );
}

export function assertNonEmptyPatch<T extends object>(
  dto: T,
  entityLabel: string,
): Array<keyof T> {
  const keys = getPatchDtoKeys(dto);

  if (keys.length === 0) {
    throw new BadRequestException(`${entityLabel} patch body cannot be empty`);
  }

  return keys;
}

export function buildGroupPatchData(dto: PatchToeicGroupDto) {
  const keys = assertNonEmptyPatch(dto, 'Group');
  const data: Record<string, string | null> = {};

  for (const key of keys) {
    data[key as string] = normalizeNullableString(dto[key]);
  }

  return { keys, data };
}

export function buildQuestionPatchData(dto: PatchToeicQuestionDto) {
  const keys = assertNonEmptyPatch(dto, 'Question');
  const data: Record<string, string | null> = {};

  for (const key of keys) {
    const value = dto[key];

    if (key === 'answerKey') {
      if (!isValidAnswerKey(value)) {
        throw new BadRequestException('Invalid answerKey');
      }

      data.answerKey = normalizeAnswerKey(value);
      continue;
    }

    data[key as string] = normalizeNullableString(value);
  }

  return { keys, data };
}
