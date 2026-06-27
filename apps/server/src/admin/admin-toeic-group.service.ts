import { Injectable, NotFoundException } from '@nestjs/common';
import type { PatchToeicGroupDto } from './dto/patch-toeic-group.dto';
import { buildGroupPatchData } from './lib/admin-toeic-patch';
import { AdminToeicRepository } from './lib/admin-toeic.repository';
import type { AdminToeicGroupPatchResponse } from './lib/admin-toeic.types';

@Injectable()
export class AdminToeicGroupService {
  constructor(private readonly repository: AdminToeicRepository) {}

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
}
