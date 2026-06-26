import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AdminTestsController } from './admin-tests.controller';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { ToeicGroupRawRepository } from './lib/toeic-group-raw.repository';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [AdminTestsController],
  providers: [AdminToeicGroupService, ToeicGroupRawRepository],
})
export class AdminModule {}
