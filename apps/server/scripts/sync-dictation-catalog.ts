import { PrismaService } from '../src/prisma/prisma.service';
import { env } from '../src/config/env';
import { syncApprovedDictationCatalog } from '../src/features/dictation-catalog/model/sync-approved-dictation-catalog';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const result = await syncApprovedDictationCatalog(
      prisma,
      env.dictationCatalogRoot,
    );
    console.log(
      `Synced ${result.videoCount} approved Dictation videos and ${result.segmentCount} segments.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
