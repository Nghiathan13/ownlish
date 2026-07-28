import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DictationController } from './dictation.controller';
import { DictationService } from './dictation.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DictationController],
  providers: [DictationService],
})
export class DictationModule {}
