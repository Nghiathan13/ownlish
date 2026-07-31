import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { LearningActivityController } from './api/learning-activity.controller';
import { LearningActivityService } from './model/learning-activity.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [LearningActivityController],
  providers: [LearningActivityService],
})
export class LearningActivityModule {}
