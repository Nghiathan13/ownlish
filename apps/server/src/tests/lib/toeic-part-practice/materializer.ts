import { Injectable } from '@nestjs/common';
import { ToeicPartPracticeRepository } from './repository';
import type { PartPracticeRunForResponse } from './session.types';

@Injectable()
export class ToeicPartPracticeMaterializer {
  constructor(
    private readonly partPracticeRepository: ToeicPartPracticeRepository,
  ) {}

  async findOrCreateRun(
    userId: string,
    partNumber: number,
  ): Promise<PartPracticeRunForResponse> {
    return this.partPracticeRepository.transaction(async (tx) => {
      return tx.toeicPartPracticeRun.upsert({
        where: {
          userId_partNumber: { userId, partNumber },
        },
        create: { userId, partNumber },
        update: {},
      });
    });
  }
}
