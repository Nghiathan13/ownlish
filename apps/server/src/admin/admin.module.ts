import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TestsModule } from '../tests/tests.module';
import { UsersModule } from '../users/users.module';
import { AdminTestsController } from './admin-tests.controller';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { AdminToeicQuestionService } from './admin-toeic-question.service';
import { AdminToeicTestService } from './admin-toeic-test.service';
import { AdminToeicRepository } from './lib/admin-toeic.repository';
import { ToeicTestRawRepository } from './lib/toeic-test-raw.repository';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, TestsModule],
  controllers: [AdminTestsController],
  providers: [
    AdminToeicGroupService,
    AdminToeicQuestionService,
    AdminToeicTestService,
    AdminToeicRepository,
    ToeicTestRawRepository,
  ],
})
export class AdminModule {}
