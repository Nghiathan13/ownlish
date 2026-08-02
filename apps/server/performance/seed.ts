import { createPerformancePrisma, seedPerformanceFixture } from './fixture';

async function main() {
  const prisma = createPerformancePrisma();

  try {
    await seedPerformanceFixture(prisma);
    console.log('Performance fixture seeded.');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
