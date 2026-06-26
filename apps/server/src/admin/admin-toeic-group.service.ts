import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PatchToeicGroupRawDto } from './dto/patch-toeic-group-raw.dto';
import {
  isValidAnswerKey,
  normalizeAnswerKey,
  normalizeNullableString,
} from './lib/toeic-group-raw.normalize';
import { mapToeicGroupRaw } from './lib/toeic-group-raw.mapper';
import { ToeicGroupRawRepository } from './lib/toeic-group-raw.repository';
import type { ToeicGroupRawPayload } from './lib/toeic-group-raw.types';

@Injectable()
export class AdminToeicGroupService {
  constructor(private readonly repository: ToeicGroupRawRepository) {}

  async getRawGroup(groupId: number): Promise<ToeicGroupRawPayload> {
    const group = await this.repository.findGroupById(groupId);

    if (!group) {
      throw new NotFoundException('TOEIC question group not found');
    }

    return mapToeicGroupRaw(group);
  }

  async patchRawGroup(
    groupId: number,
    dto: PatchToeicGroupRawDto,
  ): Promise<ToeicGroupRawPayload> {
    const existing = await this.repository.findGroupById(groupId);

    if (!existing) {
      throw new NotFoundException('TOEIC question group not found');
    }

    const existingQuestionIds = new Set(
      existing.questions.map((question) => question.id),
    );

    for (const question of dto.questions) {
      if (!existingQuestionIds.has(question.id)) {
        throw new BadRequestException(
          `Question ${question.id} does not belong to group ${groupId}`,
        );
      }
    }

    const normalizedQuestions = dto.questions.map((question) => {
      const existingQuestion = existing.questions.find(
        (item) => item.id === question.id,
      );

      if (!existingQuestion) {
        throw new BadRequestException(
          `Question ${question.id} does not belong to group ${groupId}`,
        );
      }

      if (!isValidAnswerKey(question.answerKey)) {
        throw new BadRequestException(
          `Invalid answerKey for question ${question.id}`,
        );
      }

      return {
        id: question.id,
        question:
          question.question !== undefined
            ? normalizeNullableString(question.question)
            : existingQuestion.question,
        questionVi:
          question.questionVi !== undefined
            ? normalizeNullableString(question.questionVi)
            : existingQuestion.questionVi,
        questionType:
          question.questionType !== undefined
            ? normalizeNullableString(question.questionType)
            : existingQuestion.questionType,
        optionA:
          question.optionA !== undefined
            ? normalizeNullableString(question.optionA)
            : existingQuestion.optionA,
        optionB:
          question.optionB !== undefined
            ? normalizeNullableString(question.optionB)
            : existingQuestion.optionB,
        optionC:
          question.optionC !== undefined
            ? normalizeNullableString(question.optionC)
            : existingQuestion.optionC,
        optionD:
          question.optionD !== undefined
            ? normalizeNullableString(question.optionD)
            : existingQuestion.optionD,
        optionAVi:
          question.optionAVi !== undefined
            ? normalizeNullableString(question.optionAVi)
            : existingQuestion.optionAVi,
        optionBVi:
          question.optionBVi !== undefined
            ? normalizeNullableString(question.optionBVi)
            : existingQuestion.optionBVi,
        optionCVi:
          question.optionCVi !== undefined
            ? normalizeNullableString(question.optionCVi)
            : existingQuestion.optionCVi,
        optionDVi:
          question.optionDVi !== undefined
            ? normalizeNullableString(question.optionDVi)
            : existingQuestion.optionDVi,
        answerKey:
          question.answerKey !== undefined
            ? normalizeAnswerKey(question.answerKey)
            : normalizeAnswerKey(existingQuestion.answerKey),
        explanationVi:
          question.explanationVi !== undefined
            ? normalizeNullableString(question.explanationVi)
            : existingQuestion.explanationVi,
      };
    });

    const updated = await this.repository.updateGroupRaw(
      groupId,
      {
        groupType:
          dto.group.groupType !== undefined
            ? normalizeNullableString(dto.group.groupType)
            : existing.groupType,
        accent:
          dto.group.accent !== undefined
            ? normalizeNullableString(dto.group.accent)
            : existing.accent,
        content:
          dto.group.content !== undefined
            ? normalizeNullableString(dto.group.content)
            : existing.content,
        contentVi:
          dto.group.contentVi !== undefined
            ? normalizeNullableString(dto.group.contentVi)
            : existing.contentVi,
      },
      normalizedQuestions,
    );

    return mapToeicGroupRaw(updated);
  }
}
