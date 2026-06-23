import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PracticeService } from './practice.service';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { TestsStorageService } from './tests-storage.service';
import { ToeicRunGrader } from './lib/toeic-run-grader';
import { ToeicRunMaterializer } from './lib/toeic-run-materializer';
import { ToeicRunSessionMapper } from './lib/toeic-run-session.mapper';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    TestsService,
    TestsStorageService,
    ToeicRunSessionMapper,
    ToeicRunMaterializer,
    ToeicRunGrader,
    PracticeService,
  ],
  controllers: [TestsController],
})
export class TestsModule {}
