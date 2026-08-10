import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VocabController } from './vocab.controller';
import { VocabModule } from './vocab.module';
import { VocabStatsService } from './vocab-stats.service';
import { VocabService } from './vocab.service';

describe('VocabModule', () => {
  it('wires its authentication, persistence, controller, and services', () => {
    expect(Reflect.getMetadata('imports', VocabModule)).toEqual([
      PrismaModule,
      AuthModule,
    ]);
    expect(Reflect.getMetadata('controllers', VocabModule)).toEqual([
      VocabController,
    ]);
    expect(Reflect.getMetadata('providers', VocabModule)).toEqual([
      VocabService,
      VocabStatsService,
    ]);
  });
});
