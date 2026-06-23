import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
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
  ],
  controllers: [TestsController],
})
export class TestsModule {}
