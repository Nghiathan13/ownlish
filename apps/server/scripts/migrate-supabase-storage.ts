import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

type SupabaseStorageItem = {
  id: string | null;
  name: string;
  metadata?: { mimetype?: string | null } | null;
};

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

function encodeStoragePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function main(): Promise<void> {
  const sourceBucket = requiredArgument('--source-bucket');
  const targetBucket = requiredArgument('--target-bucket');
  const targetPrefix = process.argv.includes('--target-prefix')
    ? requiredArgument('--target-prefix').replace(/^\/+|\/+$/g, '')
    : '';
  const dryRun = process.argv.includes('--dry-run');
  const supabaseUrl = requiredEnv('SUPABASE_URL').replace(/\/$/, '');
  const supabaseToken = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const r2 = new S3Client({
    region: 'auto',
    endpoint: requiredEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  });

  const list = async (prefix = ''): Promise<Array<{ path: string; mimeType: string | undefined }>> => {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/list/${encodeURIComponent(sourceBucket)}`, {
      method: 'POST',
      headers: {
        apikey: supabaseToken,
        Authorization: `Bearer ${supabaseToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prefix,
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      }),
    });
    if (!response.ok) {
      throw new Error(`Could not list ${sourceBucket}/${prefix}: ${response.status}`);
    }
    const items = (await response.json()) as SupabaseStorageItem[];
    const files: Array<{ path: string; mimeType: string | undefined }> = [];
    for (const item of items) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        files.push(...(await list(path)));
      } else {
        files.push({ path, mimeType: item.metadata?.mimetype ?? undefined });
      }
    }
    return files;
  };

  const files = await list();
  for (const file of files) {
    const targetKey = targetPrefix ? `${targetPrefix}/${file.path}` : file.path;
    if (dryRun) {
      console.log(`${sourceBucket}/${file.path} -> ${targetBucket}/${targetKey}`);
      continue;
    }

    const download = await fetch(
      `${supabaseUrl}/storage/v1/object/${encodeURIComponent(sourceBucket)}/${encodeStoragePath(file.path)}`,
      { headers: { apikey: supabaseToken, Authorization: `Bearer ${supabaseToken}` } },
    );
    if (!download.ok) {
      throw new Error(`Could not download ${sourceBucket}/${file.path}: ${download.status}`);
    }
    await r2.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: targetKey,
        Body: Buffer.from(await download.arrayBuffer()),
        ContentType: download.headers.get('content-type') ?? file.mimeType,
        CacheControl: file.path.endsWith('.json')
          ? 'no-cache'
          : 'public, max-age=31536000, immutable',
      }),
    );
    console.log(`${sourceBucket}/${file.path} -> ${targetBucket}/${targetKey}`);
  }

  console.log(`${dryRun ? 'Would migrate' : 'Migrated'} ${files.length} objects.`);
}

void main();
