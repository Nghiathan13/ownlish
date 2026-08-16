import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../../auth/auth.module';
import { ToeicCatalogGradingIndex } from '../../entities/toeic-catalog/lib/grading-index';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExperienceModule } from '../experience/experience.module';
import { ToeicRuntimeController } from './api/toeic-runtime.controller';
import { ToeicRuntimeService } from './model/toeic-runtime.service';
import { ToeicRuntimeModule } from './toeic-runtime.module';

describe('ToeicRuntimeModule', () => {
  it('wires catalog grading, runtime service, controller, and auth dependencies', () => {
    expect(
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, ToeicRuntimeModule),
    ).toEqual([PrismaModule, AuthModule, ExperienceModule]);
    expect(
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, ToeicRuntimeModule),
    ).toEqual([ToeicRuntimeController]);
    expect(
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ToeicRuntimeModule),
    ).toEqual([ToeicCatalogGradingIndex, ToeicRuntimeService]);
  });
});
