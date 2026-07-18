import { createClient } from '@supabase/supabase-js';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
  buildToeicCatalog,
  writeToeicCatalogArtifacts,
} from '../src/entities/toeic-catalog/lib/catalog-builder';

function readArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;

  if (!value || value.startsWith('--')) {
    throw new Error(`Missing ${name} argument`);
  }

  return value;
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

async function publishFile(
  bucket: ReturnType<typeof createClient>['storage'],
  bucketName: string,
  objectPath: string,
  filePath: string,
): Promise<void> {
  const { error } = await bucket
    .from(bucketName)
    .upload(objectPath, readFileSync(filePath), {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '0',
    });

  if (error) {
    throw new Error(`Cannot upload ${objectPath}: ${error.message}`);
  }
}

async function main(): Promise<void> {
  const sourceDirectory = readArgument('--source');
  const bucketName = process.argv.includes('--bucket')
    ? readArgument('--bucket')
    : 'toeic';
  const dryRun = process.argv.includes('--dry-run');
  const supabase = dryRun
    ? null
    : createClient(
        requiredEnv('SUPABASE_URL'),
        requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
  const outputDirectory = mkdtempSync(join(tmpdir(), 'engvocab-toeic-'));

  try {
    writeToeicCatalogArtifacts(
      outputDirectory,
      buildToeicCatalog(sourceDirectory),
    );
    const files = listFiles(outputDirectory).sort((left, right) => {
      const leftPath = relative(outputDirectory, left).replaceAll('\\', '/');
      const rightPath = relative(outputDirectory, right).replaceAll('\\', '/');

      return leftPath === 'catalog.json'
        ? 1
        : rightPath === 'catalog.json'
          ? -1
          : leftPath.localeCompare(rightPath);
    });

    for (const filePath of files) {
      const relativePath = relative(outputDirectory, filePath).replaceAll(
        '\\',
        '/',
      );
      const objectPath =
        relativePath === 'server/grading-index.json'
          ? 'grading-index.json'
          : relativePath;

      if (dryRun) {
        console.log(objectPath);
      } else {
        if (!supabase) {
          throw new Error('Supabase client is unavailable.');
        }
        await publishFile(supabase.storage, bucketName, objectPath, filePath);
      }
    }

    console.log(
      dryRun
        ? 'TOEIC catalog publish dry run completed.'
        : `Published TOEIC catalog to bucket ${bucketName}.`,
    );
  } finally {
    if (existsSync(outputDirectory)) {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  }
}

void main();
