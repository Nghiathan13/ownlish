import { UserRole, WordCollectionKind } from '@prisma/client';
import { DEFAULT_USER_COLLECTION_NAME } from '../collections/collections.constants';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const createCollection = jest.fn();
  const transaction = jest.fn();
  const prisma = {
    user: { findUnique, create, update },
    wordCollection: { create: createCollection },
    $transaction: transaction,
  };
  const service = new UsersService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('looks users up by their unique fields', () => {
    void service.findByEmail('user@example.com');
    void service.findByGoogleSub('google-sub');
    void service.findById('user-1');

    expect(findUnique).toHaveBeenNthCalledWith(1, {
      where: { email: 'user@example.com' },
    });
    expect(findUnique).toHaveBeenNthCalledWith(2, {
      where: { googleSub: 'google-sub' },
    });
    expect(findUnique).toHaveBeenNthCalledWith(3, { where: { id: 'user-1' } });
  });

  it('creates a user and its private default collection in one transaction', async () => {
    const tx = {
      user: { create },
      wordCollection: { create: createCollection },
    };
    transaction.mockImplementation(
      (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
    create.mockResolvedValue({ id: 'user-1', role: UserRole.USER });
    createCollection.mockResolvedValue({ id: 'collection-1' });

    await expect(
      service.create({ email: 'user@example.com', name: 'User' }),
    ).resolves.toMatchObject({ id: 'user-1' });
    expect(create).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        passwordHash: null,
        googleSub: null,
        name: 'User',
        avatarUrl: null,
      },
    });
    expect(createCollection).toHaveBeenCalledWith({
      data: {
        ownerUserId: 'user-1',
        name: DEFAULT_USER_COLLECTION_NAME,
        kind: WordCollectionKind.USER,
        isDefault: true,
        isPublic: false,
      },
    });
  });

  it('only applies optional Google fields when present', () => {
    void service.linkGoogleSub('user-1', 'google-sub');
    void service.linkGoogleSub('user-1', 'google-sub', {
      name: 'Google User',
      avatarUrl: 'https://avatar',
    });

    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
      data: { googleSub: 'google-sub' },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-1' },
      data: {
        googleSub: 'google-sub',
        name: 'Google User',
        avatarUrl: 'https://avatar',
      },
    });
  });

  it('updates profile and avatar data without clearing an omitted storage path', () => {
    void service.updateGoogleAvatar('user-1', 'https://avatar');
    void service.updateProfile('user-1', { name: 'Renamed' });
    void service.updateProfile('user-1', {
      name: 'Renamed',
      avatarStoragePath: 'users/user-1/avatar.png',
    });

    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
      data: { avatarUrl: 'https://avatar' },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-1' },
      data: { name: 'Renamed' },
    });
    expect(update).toHaveBeenNthCalledWith(3, {
      where: { id: 'user-1' },
      data: { name: 'Renamed', avatarStoragePath: 'users/user-1/avatar.png' },
    });
  });
});
