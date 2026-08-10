import { MODULE_METADATA } from '@nestjs/common/constants';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileAvatarStorageService } from './profile-avatar-storage.service';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  it('wires user and avatar services through PrismaModule', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, UsersModule)).toEqual([
      PrismaModule,
    ]);
    expect(Reflect.getMetadata(MODULE_METADATA.PROVIDERS, UsersModule)).toEqual(
      [UsersService, ProfileAvatarStorageService],
    );
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, UsersModule)).toEqual([
      UsersService,
      ProfileAvatarStorageService,
    ]);
  });
});
