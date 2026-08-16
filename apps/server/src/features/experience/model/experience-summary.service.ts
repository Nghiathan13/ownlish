import { Injectable } from '@nestjs/common';
import { ExperienceSummaryRepository } from '../data/experience-summary.repository';

@Injectable()
export class ExperienceSummaryService {
  constructor(
    private readonly experienceSummaryRepository: ExperienceSummaryRepository,
  ) {}

  async getSummary(userId: string) {
    return {
      totalXp: await this.experienceSummaryRepository.getTotalXp(userId),
    };
  }
}
