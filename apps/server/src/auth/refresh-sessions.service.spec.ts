import { RefreshSessionsService } from './refresh-sessions.service';

describe('RefreshSessionsService', () => {
  const create = jest.fn();
  const findUnique = jest.fn();
  const updateMany = jest.fn();
  const update = jest.fn();
  const prisma = {
    refreshSession: { create, findUnique, updateMany, update },
  };
  const service = new RefreshSessionsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a session with the supplied persistence fields', () => {
    const input = {
      userId: 'user-1',
      tokenHash: 'token-hash',
      expiresAt: new Date('2026-08-11T00:00:00.000Z'),
    };
    create.mockResolvedValue({ id: 'session-1' });

    expect(service.create(input)).toBe(create.mock.results[0].value);
    expect(create).toHaveBeenCalledWith({ data: input });
  });

  it('finds a session together with its user', async () => {
    findUnique.mockResolvedValue({ id: 'session-1', user: { id: 'user-1' } });

    await expect(service.findByTokenHash('token-hash')).resolves.toMatchObject({
      id: 'session-1',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'token-hash' },
      include: { user: true },
    });
  });

  it('rotates only an active matching token', async () => {
    jest.useFakeTimers();
    const now = new Date('2026-08-10T10:00:00.000Z');
    jest.setSystemTime(now);
    updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    const expiresAt = new Date('2026-08-12T00:00:00.000Z');

    await expect(
      service.rotateIfCurrentTokenMatches('session-1', 'old-hash', {
        tokenHash: 'new-hash',
        expiresAt,
      }),
    ).resolves.toBe(true);
    await expect(
      service.rotateIfCurrentTokenMatches('session-1', 'old-hash', {
        tokenHash: 'new-hash',
        expiresAt,
      }),
    ).resolves.toBe(false);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'session-1',
          tokenHash: 'old-hash',
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { tokenHash: 'new-hash', expiresAt },
      }),
    );
    jest.useRealTimers();
  });

  it('revokes a session at the current time', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-10T10:00:00.000Z'));
    update.mockResolvedValue({ id: 'session-1' });

    await service.revoke('session-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { revokedAt: new Date('2026-08-10T10:00:00.000Z') },
    });
    jest.useRealTimers();
  });
});
