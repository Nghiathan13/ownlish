import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  buildAudioStoragePath,
  buildImageStoragePath,
  partMayHaveAudio,
  partMayHaveImage,
} from '../tests/lib/toeic-media-path';
import { TestsStorageService } from '../tests/tests-storage.service';
import type { PatchToeicGroupDto } from './dto/patch-toeic-group.dto';
import { buildGroupPatchData } from './lib/admin-toeic-patch';
import { AdminToeicRepository } from './lib/admin-toeic.repository';
import type {
  AdminToeicGroupAudioDeleteResponse,
  AdminToeicGroupAudioUploadResponse,
  AdminToeicGroupImageDeleteResponse,
  AdminToeicGroupImageUploadResponse,
  AdminToeicGroupPatchResponse,
} from './lib/admin-toeic.types';

const PNG_MIME_TYPE = 'image/png';
const MP3_MIME_TYPE = 'audio/mpeg';

type UploadedMediaFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

function isPngUpload(file: UploadedMediaFile) {
  return (
    file.mimetype === PNG_MIME_TYPE &&
    file.originalname.toLowerCase().endsWith('.png')
  );
}

function isMp3Upload(file: UploadedMediaFile) {
  return (
    file.mimetype === MP3_MIME_TYPE &&
    file.originalname.toLowerCase().endsWith('.mp3')
  );
}

@Injectable()
export class AdminToeicGroupService {
  constructor(
    private readonly repository: AdminToeicRepository,
    private readonly storageService: TestsStorageService,
  ) {}

  async patchGroup(
    groupId: number,
    dto: PatchToeicGroupDto,
  ): Promise<AdminToeicGroupPatchResponse> {
    const existing = await this.repository.findGroupById(groupId);

    if (!existing) {
      throw new NotFoundException('TOEIC question group not found');
    }

    const { keys, data } = buildGroupPatchData(dto);
    const updated = await this.repository.updateGroupFields(groupId, data);
    const group: AdminToeicGroupPatchResponse['group'] = { id: groupId };

    for (const key of keys) {
      group[key] = updated[key];
    }

    return { group };
  }

  async deleteGroupAudio(
    groupId: number,
  ): Promise<AdminToeicGroupAudioDeleteResponse> {
    const existing = await this.repository.findGroupMediaById(groupId);

    if (!existing) {
      throw new NotFoundException('TOEIC question group not found');
    }

    if (existing.audioStoragePath) {
      try {
        await this.storageService.removeObject(existing.audioStoragePath);
      } catch {
        throw new InternalServerErrorException('Failed to delete group audio');
      }
    }

    await this.repository.clearGroupAudioPath(groupId);

    return {
      group: {
        id: groupId,
        audioUrl: null,
        audioUrlExpiresAt: null,
      },
    };
  }

  async deleteGroupImage(
    groupId: number,
  ): Promise<AdminToeicGroupImageDeleteResponse> {
    const existing = await this.repository.findGroupMediaById(groupId);

    if (!existing) {
      throw new NotFoundException('TOEIC question group not found');
    }

    if (existing.imageStoragePath) {
      try {
        await this.storageService.removeObject(existing.imageStoragePath);
      } catch {
        throw new InternalServerErrorException('Failed to delete group image');
      }
    }

    await this.repository.clearGroupImagePath(groupId);

    return {
      group: {
        id: groupId,
        imageUrl: null,
        imageUrlExpiresAt: null,
      },
    };
  }

  async uploadGroupAudio(
    groupId: number,
    file: UploadedMediaFile | undefined,
  ): Promise<AdminToeicGroupAudioUploadResponse> {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    if (!isMp3Upload(file)) {
      throw new BadRequestException('Audio file must be a .mp3 file');
    }

    const existing = await this.repository.findGroupMediaUploadById(groupId);

    if (!existing) {
      throw new NotFoundException('TOEIC question group not found');
    }

    const { partNumber, test } = existing.testPart;
    const { questionStart, questionEnd } = existing;

    if (!partMayHaveAudio(partNumber)) {
      throw new BadRequestException('This group does not support audio');
    }

    const audioStoragePath = buildAudioStoragePath(
      test.year,
      test.testNumber,
      questionStart,
      questionEnd,
    );

    if (
      existing.audioStoragePath &&
      existing.audioStoragePath !== audioStoragePath
    ) {
      try {
        await this.storageService.removeObject(existing.audioStoragePath);
      } catch {
        throw new InternalServerErrorException('Failed to replace group audio');
      }
    }

    try {
      await this.storageService.uploadObject(
        audioStoragePath,
        file.buffer,
        MP3_MIME_TYPE,
      );
    } catch {
      throw new InternalServerErrorException('Failed to upload group audio');
    }

    await this.repository.setGroupAudioPath(groupId, audioStoragePath);

    const signed = await this.storageService.createSignedUrl(audioStoragePath);

    if (!signed) {
      throw new InternalServerErrorException('Failed to sign uploaded audio');
    }

    return {
      group: {
        id: groupId,
        audioUrl: signed.url,
        audioUrlExpiresAt: signed.expiresAt,
      },
    };
  }

  async uploadGroupImage(
    groupId: number,
    file: UploadedMediaFile | undefined,
  ): Promise<AdminToeicGroupImageUploadResponse> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!isPngUpload(file)) {
      throw new BadRequestException('Image file must be a .png file');
    }

    const existing = await this.repository.findGroupMediaUploadById(groupId);

    if (!existing) {
      throw new NotFoundException('TOEIC question group not found');
    }

    const { partNumber, test } = existing.testPart;
    const { questionStart, questionEnd } = existing;

    if (!partMayHaveImage(partNumber, questionStart, questionEnd)) {
      throw new BadRequestException('This group does not support images');
    }

    const imageStoragePath = buildImageStoragePath(
      test.year,
      test.testNumber,
      questionStart,
      questionEnd,
    );

    if (
      existing.imageStoragePath &&
      existing.imageStoragePath !== imageStoragePath
    ) {
      try {
        await this.storageService.removeObject(existing.imageStoragePath);
      } catch {
        throw new InternalServerErrorException('Failed to replace group image');
      }
    }

    try {
      await this.storageService.uploadObject(
        imageStoragePath,
        file.buffer,
        PNG_MIME_TYPE,
      );
    } catch {
      throw new InternalServerErrorException('Failed to upload group image');
    }

    await this.repository.setGroupImagePath(groupId, imageStoragePath);

    const signed = await this.storageService.createSignedUrl(imageStoragePath);

    if (!signed) {
      throw new InternalServerErrorException('Failed to sign uploaded image');
    }

    return {
      group: {
        id: groupId,
        imageUrl: signed.url,
        imageUrlExpiresAt: signed.expiresAt,
      },
    };
  }
}
