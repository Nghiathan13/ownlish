import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export type SignedMediaUrl = {
  url: string;
  expiresAt: string;
};

const MAX_SIGNED_URLS_PER_REQUEST = 1000;

function chunkPaths(paths: string[]): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < paths.length; index += MAX_SIGNED_URLS_PER_REQUEST) {
    chunks.push(paths.slice(index, index + MAX_SIGNED_URLS_PER_REQUEST));
  }

  return chunks;
}

@Injectable()
export class TestsStorageService {
  private readonly logger = new Logger(TestsStorageService.name);
  private client: SupabaseClient | null = null;

  private getClient() {
    if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
      return null;
    }

    if (!this.client) {
      this.client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }

    return this.client;
  }

  async createSignedUrl(storagePath: string): Promise<SignedMediaUrl | null> {
    if (!storagePath) {
      return null;
    }

    const client = this.getClient();
    if (!client) {
      this.logger.warn(
        'Supabase Storage is not configured; skipping signed URL.',
      );
      return null;
    }

    const { data, error } = await client.storage
      .from(env.toeicStorageBucket)
      .createSignedUrl(storagePath, env.toeicSignedUrlTtlSeconds);

    if (error || !data?.signedUrl) {
      this.logger.warn(
        `Failed to sign media URL for ${storagePath}: ${error?.message ?? 'unknown error'}`,
      );
      return null;
    }

    const expiresAt = new Date(
      Date.now() + env.toeicSignedUrlTtlSeconds * 1000,
    ).toISOString();

    return {
      url: data.signedUrl,
      expiresAt,
    };
  }

  async uploadObject(
    storagePath: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    if (!storagePath) {
      return;
    }

    const client = this.getClient();
    if (!client) {
      this.logger.warn(
        'Supabase Storage is not configured; skipping object upload.',
      );
      throw new Error('Supabase Storage is not configured');
    }

    const { error } = await client.storage
      .from(env.toeicStorageBucket)
      .upload(storagePath, body, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.warn(
        `Failed to upload media object ${storagePath}: ${error.message}`,
      );
      throw error;
    }
  }

  async removeObject(storagePath: string): Promise<void> {
    if (!storagePath) {
      return;
    }

    const client = this.getClient();
    if (!client) {
      this.logger.warn(
        'Supabase Storage is not configured; skipping object removal.',
      );
      return;
    }

    const { error } = await client.storage
      .from(env.toeicStorageBucket)
      .remove([storagePath]);

    if (error) {
      this.logger.warn(
        `Failed to remove media object ${storagePath}: ${error.message}`,
      );
      throw error;
    }
  }

  async createSignedUrls(storagePaths: Array<string | null | undefined>) {
    const uniquePaths = [
      ...new Set(storagePaths.filter((path): path is string => Boolean(path))),
    ];

    if (uniquePaths.length === 0) {
      return new Map<string, SignedMediaUrl | null>();
    }

    const client = this.getClient();
    if (!client) {
      this.logger.warn(
        'Supabase Storage is not configured; skipping signed URLs.',
      );
      return new Map(uniquePaths.map((path) => [path, null]));
    }

    const batchResults = await Promise.all(
      chunkPaths(uniquePaths).map(async (paths) => {
        const { data, error } = await client.storage
          .from(env.toeicStorageBucket)
          .createSignedUrls(paths, env.toeicSignedUrlTtlSeconds);

        if (error || !data) {
          this.logger.warn(
            `Failed to sign media URLs: ${error?.message ?? 'unknown error'}`,
          );
          return new Map(paths.map((path) => [path, null]));
        }

        const signedUrlByPath = new Map(
          data.map((item) => [item.path, item.signedUrl]),
        );
        return new Map(
          paths.map((path) => [path, signedUrlByPath.get(path) ?? null]),
        );
      }),
    );
    const signedUrlByPath = new Map(batchResults.flatMap((batch) => [...batch]));
    const expiresAt = new Date(
      Date.now() + env.toeicSignedUrlTtlSeconds * 1000,
    ).toISOString();

    return new Map(
      uniquePaths.map((path) => {
        const url = signedUrlByPath.get(path);
        return [path, url ? { url, expiresAt } : null];
      }),
    );
  }
}
