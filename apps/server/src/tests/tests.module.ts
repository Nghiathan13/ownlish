import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PracticeService } from './practice.service';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { TestsStorageService } from './tests-storage.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [TestsService, TestsStorageService, PracticeService],
  controllers: [TestsController],
})
export class TestsModule {}
