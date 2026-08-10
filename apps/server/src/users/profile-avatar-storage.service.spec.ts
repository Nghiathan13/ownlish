import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { ProfileAvatarStorageService } from './profile-avatar-storage.service';

const originalR2Env = {
  r2Endpoint: env.r2Endpoint,
  r2AccessKeyId: env.r2AccessKeyId,
  r2SecretAccessKey: env.r2SecretAccessKey,
  r2AssetsBucket: env.r2AssetsBucket,
  publicAssetsRoot: env.publicAssetsRoot,
};

describe('ProfileAvatarStorageService', () => {
  beforeEach(() => {
    Object.assign(env, {
      r2Endpoint: 'https://account.r2.cloudflarestorage.com',
      r2AccessKeyId: 'access-key',
      r2SecretAccessKey: 'secret-key',
      r2AssetsBucket: 'ownlish-assets-staging',
      publicAssetsRoot: 'https://assets.staging.ownlish.com',
    });
  });

  afterEach(() => {
    Object.assign(env, originalR2Env);
    jest.restoreAllMocks();
  });

  it('uploads avatars to the configured R2 bucket', async () => {
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const service = new ProfileAvatarStorageService();

    const path = await service.uploadAvatar({
      body: Buffer.from('image'),
      mimeType: 'image/png',
      userId: 'user id',
    });

    expect(path).toMatch(/^users\/user id\/[\w-]+\.png$/);
    expect(send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect((send.mock.calls[0][0] as PutObjectCommand).input).toMatchObject({
      Bucket: 'ownlish-assets-staging',
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    });
  });

  it('deletes the original R2 object key', async () => {
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const service = new ProfileAvatarStorageService();

    await service.removeAvatar('users/user-id/avatar.png');

    expect(send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    expect((send.mock.calls[0][0] as DeleteObjectCommand).input).toEqual({
      Bucket: 'ownlish-assets-staging',
      Key: 'users/user-id/avatar.png',
    });
  });

  it('returns an encoded public custom-domain URL', () => {
    const service = new ProfileAvatarStorageService();

    expect(service.getPublicUrl('users/a user/avatar image.png')).toBe(
      'https://assets.staging.ownlish.com/users/a%20user/avatar%20image.png',
    );
  });
});
