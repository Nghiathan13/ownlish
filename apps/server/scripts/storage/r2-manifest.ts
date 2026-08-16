import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];

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

async function main(): Promise<void> {
  const bucket = requiredArgument('--bucket');
  const prefix = process.argv.includes('--prefix')
    ? requiredArgument('--prefix').replace(/^\/+|\/+$/g, '')
    : '';
  const client = new S3Client({
    region: 'auto',
    endpoint: requiredEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
  const objects: Array<{ key: string; size: number }> = [];
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of page.Contents ?? []) {
      if (object.Key) {
        objects.push({ key: object.Key, size: object.Size ?? 0 });
      }
    }
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);

  objects.sort((left, right) => left.key.localeCompare(right.key));
  const bytes = objects.reduce((total, object) => total + object.size, 0);
  console.log(JSON.stringify({ bucket, prefix, objects: objects.length, bytes, items: objects }, null, 2));
}

void main();
