import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VocabController } from './vocab.controller';
import { VocabStatsService } from './vocab-stats.service';
import { VocabService } from './vocab.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [VocabService, VocabStatsService],
  controllers: [VocabController],
})
export class VocabModule {}
