import {
  LearningActivityType,
  PrismaClient,
  WordCollectionKind,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

export const PERFORMANCE_VUS = Number(process.env.PERFORMANCE_VUS ?? 10);
export const PERFORMANCE_EMAIL_PREFIX =
  process.env.PERFORMANCE_EMAIL_PREFIX ?? 'performance-benchmark-vu-';
export const PERFORMANCE_PASSWORD =
  process.env.PERFORMANCE_PASSWORD ?? 'performance-benchmark-password';
export const PERFORMANCE_SYSTEM_COLLECTION_ID =
  '10000000-0000-4000-8000-000000000001';
export const PERFORMANCE_SYSTEM_ENTRY_ID_PREFIX = 'performance-oxford-a1-';
const BENCHMARK_DAYS = 180;

export function getPerformanceEmail(vu: number) {
  return `${PERFORMANCE_EMAIL_PREFIX}${String(vu).padStart(2, '0')}@engvocab.local`;
}

export function getPerformanceCollectionId(vu: number) {
  return `20000000-0000-4000-8000-${String(vu).padStart(12, '0')}`;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.PERFORMANCE_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('PERFORMANCE_DATABASE_URL is not set');
  }

  const hostname = new URL(databaseUrl).hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error('PERFORMANCE_DATABASE_URL must use localhost or 127.0.0.1');
  }

  return databaseUrl;
}

export function createPerformancePrisma() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });
}

export async function seedPerformanceFixture(prisma: PrismaClient) {
  if (!Number.isInteger(PERFORMANCE_VUS) || PERFORMANCE_VUS < 1) {
    throw new Error('PERFORMANCE_VUS must be a positive integer');
  }

  await cleanupPerformanceFixture(prisma);

  const passwordHash = await bcrypt.hash(PERFORMANCE_PASSWORD, 10);
  const users = await Promise.all(
    Array.from({ length: PERFORMANCE_VUS }, async (_, index) => {
      const vu = index + 1;
      return prisma.user.create({
        data: {
          email: getPerformanceEmail(vu),
          passwordHash,
          name: `Performance Benchmark VU ${vu}`,
          collections: {
            create: {
              id: getPerformanceCollectionId(vu),
              name: `Performance collection ${vu}`,
              kind: WordCollectionKind.USER,
              isDefault: true,
            },
          },
        },
      });
    }),
  );

  const entries = Array.from({ length: 20 }, (_, index) => ({
    id: `${PERFORMANCE_SYSTEM_ENTRY_ID_PREFIX}${String(index + 1).padStart(2, '0')}`,
    word: `Performance word ${index + 1}`,
    normalizedWord: `performance-word-${index + 1}`,
    sourceWordId: 990000 + index,
    type: 'noun',
    meaningVi: `Nghĩa benchmark ${index + 1}`,
    definition: `Definition for performance word ${index + 1}.`,
    example: `This is performance word ${index + 1}.`,
    exampleVi: `Đây là từ benchmark ${index + 1}.`,
    band: 'A1',
    source: 'oxford_3000',
    sortOrder: index + 1,
  }));

  await prisma.wordCollection.create({
    data: {
      id: PERFORMANCE_SYSTEM_COLLECTION_ID,
      name: 'Performance Oxford A1',
      kind: WordCollectionKind.SYSTEM,
      source: 'performance',
      cefrLevel: 'A1',
      isPublic: true,
    },
  });
  await prisma.systemVocabularyEntry.createMany({ data: entries });
  await prisma.userSystemVocabularyProgress.createMany({
    data: users.flatMap((user) =>
      entries.slice(0, 5).map((entry, index) => ({
        userId: user.id,
        systemEntryId: entry.id,
        level: index + 1,
        wrongCount: index,
      })),
    ),
  });

  await prisma.userVocabularyEntry.createMany({
    data: users.flatMap((user, userIndex) =>
      Array.from({ length: 3 }, (_, entryIndex) => ({
        userId: user.id,
        collectionId: getPerformanceCollectionId(userIndex + 1),
        word: `Seed vocabulary ${userIndex + 1}-${entryIndex + 1}`,
        normalizedWord: `seed-vocabulary-${userIndex + 1}-${entryIndex + 1}`,
        source: 'manual',
        level: entryIndex,
        wrongCount: entryIndex === 2 ? 4 : 0,
      })),
    ),
  });

  const today = new Date();
  const activityTypes = Object.values(LearningActivityType);
  await prisma.userLearningDaily.createMany({
    data: users.flatMap((user) =>
      Array.from({ length: BENCHMARK_DAYS }, (_, dayOffset) => {
        const learnedOn = new Date(today);
        learnedOn.setUTCDate(today.getUTCDate() - dayOffset);
        learnedOn.setUTCHours(0, 0, 0, 0);

        return activityTypes.map((activityType, typeIndex) => ({
          userId: user.id,
          learnedOn,
          activityType,
          seconds: 60 + typeIndex * 15,
        }));
      }).flat(),
    ),
  });
}

export async function cleanupPerformanceFixture(prisma: PrismaClient) {
  await prisma.user.deleteMany({
    where: { email: { startsWith: PERFORMANCE_EMAIL_PREFIX } },
  });
  await prisma.wordCollection.deleteMany({
    where: { id: PERFORMANCE_SYSTEM_COLLECTION_ID },
  });
  await prisma.systemVocabularyEntry.deleteMany({
    where: { id: { startsWith: PERFORMANCE_SYSTEM_ENTRY_ID_PREFIX } },
  });
}
