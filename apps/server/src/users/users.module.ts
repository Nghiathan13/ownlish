import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileAvatarStorageService } from './profile-avatar-storage.service';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, ProfileAvatarStorageService],
  exports: [UsersService, ProfileAvatarStorageService],
})
export class UsersModule {}
