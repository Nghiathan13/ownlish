import {
  createPerformancePrisma,
  getPerformanceEmail,
  seedPerformanceFixture,
} from '../performance/fixture';

const DICTATION_VIDEO_ID = 'Ys7-6_t7OEQ';

async function main() {
  const prisma = createPerformancePrisma();

  try {
    await seedPerformanceFixture(prisma);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getPerformanceEmail(1) },
    });

    await prisma.dictationProgress.upsert({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: DICTATION_VIDEO_ID,
        },
      },
      create: {
        userId: user.id,
        videoId: DICTATION_VIDEO_ID,
        answeredSegmentIds: ['s001', 's002'],
        correctCount: 2,
      },
      update: {
        answeredSegmentIds: ['s001', 's002'],
        correctCount: 2,
        completedAt: null,
      },
    });

    console.log('Lighthouse fixture seeded.');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
