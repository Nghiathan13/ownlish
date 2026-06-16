import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export type SignedMediaUrl = {
  url: string;
  expiresAt: string;
};

@Injectable()
export class TestsStorageService {
  private client: SupabaseClient | null = null;

  private getClient() {
    if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
      throw new ServiceUnavailableException(
        'Supabase Storage is not configured.',
      );
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
    const { data, error } = await client.storage
      .from(env.toeicStorageBucket)
      .createSignedUrl(storagePath, env.toeicSignedUrlTtlSeconds);

    if (error || !data?.signedUrl) {
      throw new ServiceUnavailableException(
        `Failed to sign media URL for ${storagePath}.`,
      );
    }

    const expiresAt = new Date(
      Date.now() + env.toeicSignedUrlTtlSeconds * 1000,
    ).toISOString();

    return {
      url: data.signedUrl,
      expiresAt,
    };
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
