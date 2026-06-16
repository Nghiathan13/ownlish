import type { INestApplication } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

export function getE2ePrisma(app: INestApplication): PrismaClient {
  return app.get<PrismaClient>(PrismaService);
}
