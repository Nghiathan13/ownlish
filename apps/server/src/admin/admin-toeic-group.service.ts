import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TestsStorageService } from '../tests/tests-storage.service';
import type { PatchToeicGroupDto } from './dto/patch-toeic-group.dto';
import { buildGroupPatchData } from './lib/admin-toeic-patch';
import { AdminToeicRepository } from './lib/admin-toeic.repository';
import type {
  AdminToeicGroupImageDeleteResponse,
  AdminToeicGroupPatchResponse,
} from './lib/admin-toeic.types';

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
}
