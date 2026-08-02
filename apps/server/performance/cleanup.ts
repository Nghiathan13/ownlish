import { cleanupPerformanceFixture, createPerformancePrisma } from './fixture';

async function main() {
  const prisma = createPerformancePrisma();

  try {
    await cleanupPerformanceFixture(prisma);
    console.log('Performance fixture cleaned up.');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
