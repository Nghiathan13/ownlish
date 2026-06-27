import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { AdminToeicRepository } from './lib/admin-toeic.repository';

describe('AdminToeicGroupService', () => {
  const repositoryMock = {
    findGroupById: jest.fn(),
    updateGroupFields: jest.fn(),
  };

  let service: AdminToeicGroupService;

  const existingGroup = {
    id: 101,
    groupType: 'single',
    accent: 'us',
    content: 'Passage',
    contentVi: 'Đoạn văn',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminToeicGroupService(
      repositoryMock as unknown as AdminToeicRepository,
    );
  });

  it('patches only group content and returns normalized DB values', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);
    repositoryMock.updateGroupFields.mockResolvedValue({
      ...existingGroup,
      content: 'Updated',
    });

    const result = await service.patchGroup(101, { content: 'Updated' });

    expect(repositoryMock.updateGroupFields).toHaveBeenCalledWith(101, {
      content: 'Updated',
    });
    expect(result).toEqual({
      group: {
        id: 101,
        content: 'Updated',
      },
    });
  });

  it('normalizes empty strings to null in the response', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);
    repositoryMock.updateGroupFields.mockResolvedValue({
      ...existingGroup,
      content: null,
      contentVi: null,
    });

    const result = await service.patchGroup(101, {
      content: '',
      contentVi: '',
    });

    expect(repositoryMock.updateGroupFields).toHaveBeenCalledWith(101, {
      content: null,
      contentVi: null,
    });
    expect(result).toEqual({
      group: {
        id: 101,
        content: null,
        contentVi: null,
      },
    });
  });

  it('does not update questions when patching group content only', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);
    repositoryMock.updateGroupFields.mockResolvedValue({
      ...existingGroup,
      content: 'Updated',
    });

    await service.patchGroup(101, { content: 'Updated' });

    expect(repositoryMock.updateGroupFields).toHaveBeenCalledTimes(1);
  });

  it('rejects empty patch body', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);

    await expect(service.patchGroup(101, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repositoryMock.updateGroupFields).not.toHaveBeenCalled();
  });

  it('throws not found when group is missing', async () => {
    repositoryMock.findGroupById.mockResolvedValue(null);

    await expect(
      service.patchGroup(999, { content: 'Updated' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
