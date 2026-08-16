import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ToeicCatalogGradingIndex } from '../../entities/toeic-catalog/lib/grading-index';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExperienceModule } from '../experience/experience.module';
import { ToeicRuntimeController } from './api/toeic-runtime.controller';
import { ToeicRuntimeService } from './model/toeic-runtime.service';

@Module({
  imports: [PrismaModule, AuthModule, ExperienceModule],
  controllers: [ToeicRuntimeController],
  providers: [ToeicCatalogGradingIndex, ToeicRuntimeService],
})
export class ToeicRuntimeModule {}
