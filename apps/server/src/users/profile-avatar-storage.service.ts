import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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
  private client: S3Client | null = null;

  getPublicUrl(storagePath: string): string | null {
    if (!env.publicAssetsRoot) {
      return null;
    }

    const encodedPath = storagePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${env.publicAssetsRoot.replace(/\/$/, '')}/${encodedPath}`;
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
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: env.r2AssetsBucket,
          Key: storagePath,
          Body: input.body,
          ContentType: input.mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch {
      throw new InternalServerErrorException('Could not upload profile image');
    }

    return storagePath;
  }

  async removeAvatar(storagePath: string): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return;
    }

    await client.send(
      new DeleteObjectCommand({
        Bucket: env.r2AssetsBucket,
        Key: storagePath,
      }),
    );
  }

  private getClient(): S3Client | null {
    if (
      !env.r2Endpoint ||
      !env.r2AccessKeyId ||
      !env.r2SecretAccessKey ||
      !env.r2AssetsBucket
    ) {
      return null;
    }

    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: env.r2Endpoint,
        credentials: {
          accessKeyId: env.r2AccessKeyId,
          secretAccessKey: env.r2SecretAccessKey,
        },
      });
    }

    return this.client;
  }
}
