import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExperienceController } from './api/experience.controller';
import { ExperienceAwardRepository } from './data/experience-award.repository';
import { ReviewGradeReceiptRepository } from './data/review-grade-receipt.repository';
import { ExperienceSummaryRepository } from './data/experience-summary.repository';
import { EXPERIENCE_AWARDER } from './experience-awarder';
import { EXPERIENCE_REVIEW_RECEIPTS } from './experience-review-receipts';
import { ExperienceAwardService } from './model/experience-award.service';
import { ReviewGradeReceiptService } from './model/review-grade-receipt.service';
import { ExperienceSummaryService } from './model/experience-summary.service';
import { ExperienceModule } from './experience.module';

describe('ExperienceModule', () => {
  it('wires its authenticated API, data, and model layers', () => {
    expect(
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, ExperienceModule),
    ).toEqual([AuthModule, PrismaModule]);
    expect(
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, ExperienceModule),
    ).toEqual([ExperienceController]);
    expect(
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ExperienceModule),
    ).toEqual([
      ExperienceAwardService,
      ExperienceAwardRepository,
      ReviewGradeReceiptRepository,
      ReviewGradeReceiptService,
      ExperienceSummaryRepository,
      ExperienceSummaryService,
      { provide: EXPERIENCE_AWARDER, useExisting: ExperienceAwardService },
      {
        provide: EXPERIENCE_REVIEW_RECEIPTS,
        useExisting: ReviewGradeReceiptService,
      },
    ]);
  });
});
