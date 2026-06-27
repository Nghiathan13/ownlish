import { Injectable, NotFoundException } from '@nestjs/common';
import type { PatchToeicQuestionDto } from './dto/patch-toeic-question.dto';
import { buildQuestionPatchData } from './lib/admin-toeic-patch';
import { AdminToeicRepository } from './lib/admin-toeic.repository';
import type { AdminToeicQuestionPatchResponse } from './lib/admin-toeic.types';
import { parseAnswerKey } from '../tests/lib/toeic-question-mapper';

@Injectable()
export class AdminToeicQuestionService {
  constructor(private readonly repository: AdminToeicRepository) {}

  async patchQuestion(
    questionId: number,
    dto: PatchToeicQuestionDto,
  ): Promise<AdminToeicQuestionPatchResponse> {
    const existing = await this.repository.findQuestionById(questionId);

    if (!existing) {
      throw new NotFoundException('TOEIC question not found');
    }

    const { keys, data } = buildQuestionPatchData(dto);
    const updated = await this.repository.updateQuestionFields(
      questionId,
      data,
    );
    const question: AdminToeicQuestionPatchResponse['question'] = {
      id: questionId,
    };

    for (const key of keys) {
      if (key === 'answerKey') {
        question.answerKey = parseAnswerKey(updated.answerKey);
        continue;
      }

      question[key] = updated[key];
    }

    return { question };
  }
}
