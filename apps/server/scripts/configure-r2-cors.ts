import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];

  if (index !== -1 && (!value || value.startsWith('--'))) {
    throw new Error(`Missing ${name} argument`);
  }

  return value;
}

async function main(): Promise<void> {
  const client = new S3Client({
    region: 'auto',
    endpoint: requiredEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
  const selectedBucket = readArgument('--bucket');
  const buckets = selectedBucket
    ? [selectedBucket]
    : [requiredEnv('R2_CONTENT_BUCKET'), requiredEnv('R2_ASSETS_BUCKET')];

  for (const bucket of buckets) {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: [
                'https://ownlish.com',
                'https://staging.ownlish.com',
              ],
              AllowedMethods: ['GET', 'HEAD'],
              AllowedHeaders: ['Range'],
              ExposeHeaders: ['Accept-Ranges', 'Content-Range', 'ETag'],
              MaxAgeSeconds: 86400,
            },
          ],
        },
      }),
    );
    console.log(`Configured CORS for ${bucket}.`);
  }
}

void main();
