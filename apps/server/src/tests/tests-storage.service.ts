import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export type SignedMediaUrl = {
  url: string;
  expiresAt: string;
};

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

    const entries = await Promise.all(
      uniquePaths.map(async (path) => {
        const signed = await this.createSignedUrl(path);
        return [path, signed] as const;
      }),
    );

    return new Map(entries);
  }
}
