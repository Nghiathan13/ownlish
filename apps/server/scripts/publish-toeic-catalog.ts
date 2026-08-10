import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
  copyToeicCatalogMediaArtifacts,
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
  client: S3Client,
  bucketName: string,
  objectPath: string,
  filePath: string,
): Promise<void> {
  const extension = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  const contentType =
    extension === '.mp3'
      ? 'audio/mpeg'
      : extension === '.png'
        ? 'image/png'
        : extension === '.avif'
          ? 'image/avif'
          : 'application/json';
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectPath,
      Body: readFileSync(filePath),
      ContentType: contentType,
      CacheControl: objectPath.endsWith('.json')
        ? 'no-cache'
        : 'public, max-age=31536000, immutable',
    }),
  );
}

async function main(): Promise<void> {
  const sourceDirectory = readArgument('--source');
  const dryRun = process.argv.includes('--dry-run');
  const bucketName = process.argv.includes('--bucket')
    ? readArgument('--bucket')
    : process.env.R2_CONTENT_BUCKET ??
      (dryRun ? 'ownlish-content-prod' : requiredEnv('R2_CONTENT_BUCKET'));
  const prefix = process.argv.includes('--prefix')
    ? readArgument('--prefix').replace(/^\/+|\/+$/g, '')
    : 'toeic';
  const client = dryRun
    ? null
    : new S3Client({
        region: 'auto',
        endpoint: requiredEnv('R2_ENDPOINT'),
        credentials: {
          accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
          secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
        },
      });
  const outputDirectory = mkdtempSync(join(tmpdir(), 'ownlish-toeic-'));

  try {
    writeToeicCatalogArtifacts(
      outputDirectory,
      buildToeicCatalog(sourceDirectory),
    );
    copyToeicCatalogMediaArtifacts(sourceDirectory, outputDirectory);
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
      const relativeObjectPath =
        relativePath === 'server/grading-index.json'
          ? 'grading-index.json'
          : relativePath;
      const objectPath = prefix
        ? `${prefix}/${relativeObjectPath}`
        : relativeObjectPath;

      if (dryRun) {
        console.log(objectPath);
      } else {
        if (!client) {
          throw new Error('R2 client is unavailable.');
        }
        await publishFile(client, bucketName, objectPath, filePath);
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
