import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';

const AVATAR_EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type ProfileAvatarMimeType = keyof typeof AVATAR_EXTENSION_BY_MIME_TYPE;

function isProfileAvatarMimeType(
  mimeType: string,
): mimeType is ProfileAvatarMimeType {
  return mimeType in AVATAR_EXTENSION_BY_MIME_TYPE;
}

@Injectable()
export class ProfileAvatarStorageService {
  private client: SupabaseClient | null = null;

  getPublicUrl(storagePath: string): string | null {
    if (!env.supabaseUrl) {
      return null;
    }

    const encodedPath = storagePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${env.supabaseUrl}/storage/v1/object/public/${env.profileAvatarStorageBucket}/${encodedPath}`;
  }

  async uploadAvatar(input: {
    body: Buffer;
    mimeType: string;
    userId: string;
  }): Promise<string> {
    if (!isProfileAvatarMimeType(input.mimeType)) {
      throw new BadRequestException('Unsupported profile image type');
    }

    const client = this.getClient();
    if (!client) {
      throw new InternalServerErrorException(
        'Profile images are not configured',
      );
    }

    const storagePath = `users/${input.userId}/${randomUUID()}.${AVATAR_EXTENSION_BY_MIME_TYPE[input.mimeType]}`;
    const { error } = await client.storage
      .from(env.profileAvatarStorageBucket)
      .upload(storagePath, input.body, {
        contentType: input.mimeType,
      });

    if (error) {
      throw new InternalServerErrorException('Could not upload profile image');
    }

    return storagePath;
  }

  async removeAvatar(storagePath: string): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return;
    }

    await client.storage
      .from(env.profileAvatarStorageBucket)
      .remove([storagePath]);
  }

  private getClient(): SupabaseClient | null {
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
}
