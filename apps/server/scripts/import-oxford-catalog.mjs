import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, WordCollectionKind } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const OXFORD_SOURCE = 'oxford';
const OXFORD_DEFINITION_SOURCES = ['oxford_3000', 'oxford_5000'];
const OXFORD_CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlitePath = resolve(process.argv[2] ?? '../vocab_english.db');

if (!existsSync(sqlitePath)) {
  throw new Error(`SQLite database not found: ${sqlitePath}`);
}

function buildPrismaPgConfig(connectionString) {
  const parsedUrl = new URL(connectionString);
  const sslMode = parsedUrl.searchParams.get('sslmode');

  if (sslMode !== 'no-verify') {
    return {
      connectionString,
    };
  }

  parsedUrl.searchParams.delete('sslmode');

  return {
    connectionString: parsedUrl.toString(),
    ssl: {
      rejectUnauthorized: false,
    },
  };
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(buildPrismaPgConfig(databaseUrl)),
});

function readOxfordDefinitions() {
  const sources = OXFORD_DEFINITION_SOURCES.map((source) => `'${source}'`).join(
    ', ',
  );
  const levels = OXFORD_CEFR_LEVELS.map((level) => `'${level}'`).join(', ');
  const query = `
    SELECT
      w.id AS source_word_id,
      w.word,
      d.id AS source_definition_id,
      d.type,
      d.meaning_vi,
      d.definition,
      d.example,
      d.example_vi,
      d.ipa_uk,
      d.ipa_us,
      d.band,
      d.source
    FROM words w
    JOIN definitions d ON d.word_id = w.id
    WHERE d.source IN (${sources})
      AND d.band IN (${levels})
    ORDER BY d.band, w.word, d.type;
  `;
  const result = spawnSync('sqlite3', ['-json', sqlitePath, query], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to read SQLite database');
  }

  return JSON.parse(result.stdout || '[]');
}

function normalizeWord(word) {
  return word.trim().toLowerCase();
}

async function main() {
  const rows = readOxfordDefinitions();
  const wordsByNormalizedWord = new Map();
  const definitionsByLevel = new Map(
    OXFORD_CEFR_LEVELS.map((level) => [level, []]),
  );

  for (const row of rows) {
    const normalizedWord = normalizeWord(row.word);

    wordsByNormalizedWord.set(normalizedWord, {
      sourceWordId: row.source_word_id,
      word: row.word,
      normalizedWord,
    });
    definitionsByLevel.get(row.band)?.push(row);
  }

  console.log(`Importing ${wordsByNormalizedWord.size} Oxford words...`);

  const catalogWordIdByNormalizedWord = new Map();

  for (const word of wordsByNormalizedWord.values()) {
    const catalogWord = await prisma.catalogWord.upsert({
      where: {
        normalizedWord: word.normalizedWord,
      },
      update: {
        word: word.word,
      },
      create: {
        word: word.word,
        normalizedWord: word.normalizedWord,
      },
    });

    catalogWordIdByNormalizedWord.set(word.normalizedWord, catalogWord.id);
  }

  console.log(`Importing ${rows.length} Oxford definitions...`);

  for (const row of rows) {
    const normalizedWord = normalizeWord(row.word);
    const catalogWordId = catalogWordIdByNormalizedWord.get(normalizedWord);

    await prisma.catalogDefinition.upsert({
      where: {
        source_sourceDefinitionId: {
          source: row.source,
          sourceDefinitionId: row.source_definition_id,
        },
      },
      update: {
        catalogWordId,
        sourceWordId: row.source_word_id,
        type: row.type,
        meaningVi: row.meaning_vi,
        definition: row.definition,
        example: row.example,
        exampleVi: row.example_vi,
        ipaUk: row.ipa_uk,
        ipaUs: row.ipa_us,
        band: row.band,
      },
      create: {
        catalogWordId,
        sourceDefinitionId: row.source_definition_id,
        sourceWordId: row.source_word_id,
        type: row.type,
        meaningVi: row.meaning_vi,
        definition: row.definition,
        example: row.example,
        exampleVi: row.example_vi,
        ipaUk: row.ipa_uk,
        ipaUs: row.ipa_us,
        band: row.band,
        source: row.source,
      },
    });
  }

  for (const level of OXFORD_CEFR_LEVELS) {
    const existingCollection = await prisma.wordCollection.findFirst({
      where: {
        kind: WordCollectionKind.SYSTEM,
        source: OXFORD_SOURCE,
        cefrLevel: level,
      },
    });
    const collection = existingCollection
      ? await prisma.wordCollection.update({
          where: {
            id: existingCollection.id,
          },
          data: {
            name: `Oxford ${level}`,
            description: `Oxford vocabulary words for CEFR ${level}.`,
            isPublic: true,
          },
        })
      : await prisma.wordCollection.create({
          data: {
            name: `Oxford ${level}`,
            description: `Oxford vocabulary words for CEFR ${level}.`,
            kind: WordCollectionKind.SYSTEM,
            source: OXFORD_SOURCE,
            cefrLevel: level,
            isPublic: true,
          },
        });
    const normalizedWordsForLevel = new Set(
      definitionsByLevel.get(level).map((row) => normalizeWord(row.word)),
    );
    let sortOrder = 0;

    for (const normalizedWord of normalizedWordsForLevel) {
      const catalogWordId = catalogWordIdByNormalizedWord.get(normalizedWord);

      await prisma.collectionCatalogItem.upsert({
        where: {
          collectionId_catalogWordId: {
            collectionId: collection.id,
            catalogWordId,
          },
        },
        update: {
          sortOrder,
        },
        create: {
          collectionId: collection.id,
          catalogWordId,
          sortOrder,
        },
      });

      sortOrder += 1;
    }

    console.log(`Imported ${normalizedWordsForLevel.size} words for ${level}.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
