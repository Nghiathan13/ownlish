import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ToeicPartPracticeGrader } from './lib/toeic-part-practice/grader';
import { ToeicPartPracticeMaterializer } from './lib/toeic-part-practice/materializer';
import { ToeicPartPracticeRepository } from './lib/toeic-part-practice/repository';
import { ToeicPartPracticeSessionMapper } from './lib/toeic-part-practice/session.mapper';
import { PartPracticeService } from './part-practice.service';
import { ToeicRunService } from './toeic-run.service';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { TestsStorageService } from './tests-storage.service';
import { ToeicRunGrader } from './lib/toeic-run/grader';
import { ToeicRunMaterializer } from './lib/toeic-run/materializer';
import { ToeicRunRepository } from './lib/toeic-run/repository';
import { ToeicRunSessionMapper } from './lib/toeic-run/session.mapper';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    TestsService,
    TestsStorageService,
    ToeicRunRepository,
    ToeicRunSessionMapper,
    ToeicRunMaterializer,
    ToeicRunGrader,
    ToeicRunService,
    ToeicPartPracticeRepository,
    ToeicPartPracticeSessionMapper,
    ToeicPartPracticeMaterializer,
    ToeicPartPracticeGrader,
    PartPracticeService,
  ],
  controllers: [TestsController],
  exports: [TestsStorageService],
})
export class TestsModule {}
