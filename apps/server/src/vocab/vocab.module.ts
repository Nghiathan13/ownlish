import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExperienceModule } from '../features/experience/experience.module';
import { VocabController } from './vocab.controller';
import { VocabStatsService } from './vocab-stats.service';
import { VocabService } from './vocab.service';

@Module({
  imports: [PrismaModule, AuthModule, ExperienceModule],
  providers: [VocabService, VocabStatsService],
  controllers: [VocabController],
})
export class VocabModule {}
