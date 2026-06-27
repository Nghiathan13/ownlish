import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { AdminToeicRepository } from './lib/admin-toeic.repository';
import type { TestsStorageService } from '../tests/tests-storage.service';

describe('AdminToeicGroupService', () => {
  const repositoryMock = {
    findGroupById: jest.fn(),
    findGroupMediaById: jest.fn(),
    findGroupImageUploadById: jest.fn(),
    updateGroupFields: jest.fn(),
    clearGroupImagePath: jest.fn(),
    setGroupImagePath: jest.fn(),
  };

  const storageServiceMock = {
    removeObject: jest.fn(),
    uploadObject: jest.fn(),
    createSignedUrl: jest.fn(),
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
      storageServiceMock as unknown as TestsStorageService,
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

  it('deletes group image from storage and clears the DB path', async () => {
    repositoryMock.findGroupMediaById.mockResolvedValue({
      id: 101,
      imageStoragePath: 'toeic/2026/image/ets26_t01/ets26_t01_01.png',
    });
    repositoryMock.clearGroupImagePath.mockResolvedValue({
      id: 101,
      imageStoragePath: null,
    });

    const result = await service.deleteGroupImage(101);

    expect(storageServiceMock.removeObject).toHaveBeenCalledWith(
      'toeic/2026/image/ets26_t01/ets26_t01_01.png',
    );
    expect(repositoryMock.clearGroupImagePath).toHaveBeenCalledWith(101);
    expect(result).toEqual({
      group: {
        id: 101,
        imageUrl: null,
        imageUrlExpiresAt: null,
      },
    });
  });

  it('clears DB path when group has no image', async () => {
    repositoryMock.findGroupMediaById.mockResolvedValue({
      id: 101,
      imageStoragePath: null,
    });
    repositoryMock.clearGroupImagePath.mockResolvedValue({
      id: 101,
      imageStoragePath: null,
    });

    const result = await service.deleteGroupImage(101);

    expect(storageServiceMock.removeObject).not.toHaveBeenCalled();
    expect(repositoryMock.clearGroupImagePath).toHaveBeenCalledWith(101);
    expect(result.group.imageUrl).toBeNull();
  });

  it('throws when storage deletion fails', async () => {
    repositoryMock.findGroupMediaById.mockResolvedValue({
      id: 101,
      imageStoragePath: 'toeic/2026/image/ets26_t01/ets26_t01_01.png',
    });
    storageServiceMock.removeObject.mockRejectedValue(new Error('storage error'));

    await expect(service.deleteGroupImage(101)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(repositoryMock.clearGroupImagePath).not.toHaveBeenCalled();
  });

  it('throws not found when deleting image for missing group', async () => {
    repositoryMock.findGroupMediaById.mockResolvedValue(null);

    await expect(service.deleteGroupImage(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('uploads a png image to the normalized storage path', async () => {
    repositoryMock.findGroupImageUploadById.mockResolvedValue({
      id: 101,
      imageStoragePath: null,
      questionStart: 1,
      questionEnd: 1,
      testPart: {
        partNumber: 1,
        test: { testNumber: 1 },
      },
    });
    storageServiceMock.uploadObject.mockResolvedValue(undefined);
    storageServiceMock.createSignedUrl.mockResolvedValue({
      url: 'https://signed.example/ets26_t01_01.png',
      expiresAt: '2026-06-26T12:00:00.000Z',
    });
    repositoryMock.setGroupImagePath.mockResolvedValue({
      id: 101,
      imageStoragePath: 'toeic/2026/image/ets26_t01/ets26_t01_01.png',
    });

    const file = {
      buffer: Buffer.from('png'),
      mimetype: 'image/png',
      originalname: 'photo.PNG',
    };

    const result = await service.uploadGroupImage(101, file);

    expect(storageServiceMock.uploadObject).toHaveBeenCalledWith(
      'toeic/2026/image/ets26_t01/ets26_t01_01.png',
      file.buffer,
      'image/png',
    );
    expect(repositoryMock.setGroupImagePath).toHaveBeenCalledWith(
      101,
      'toeic/2026/image/ets26_t01/ets26_t01_01.png',
    );
    expect(result).toEqual({
      group: {
        id: 101,
        imageUrl: 'https://signed.example/ets26_t01_01.png',
        imageUrlExpiresAt: '2026-06-26T12:00:00.000Z',
      },
    });
  });

  it('rejects non-png uploads', async () => {
    await expect(
      service.uploadGroupImage(101, {
        buffer: Buffer.from('jpg'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects uploads for groups that do not support images', async () => {
    repositoryMock.findGroupImageUploadById.mockResolvedValue({
      id: 101,
      imageStoragePath: null,
      questionStart: 32,
      questionEnd: 34,
      testPart: {
        partNumber: 3,
        test: { testNumber: 1 },
      },
    });

    await expect(
      service.uploadGroupImage(101, {
        buffer: Buffer.from('png'),
        mimetype: 'image/png',
        originalname: 'photo.png',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
