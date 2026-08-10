import { MODULE_METADATA } from '@nestjs/common/constants';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  it('provides and exports PrismaService', () => {
    expect(
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, PrismaModule),
    ).toEqual([PrismaService]);
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, PrismaModule)).toEqual([
      PrismaService,
    ]);
  });
});
