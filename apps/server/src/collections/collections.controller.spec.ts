import { CollectionsController } from './collections.controller';

describe('CollectionsController', () => {
  const service = {
    list: jest.fn(),
    createUserCollection: jest.fn(),
    getOxfordMeta: jest.fn(),
    getOxfordProgressSummary: jest.fn(),
    getOxfordPart: jest.fn(),
    importOxfordPart: jest.fn(),
    getCatalogWordsPage: jest.fn(),
    get: jest.fn(),
    importToVocabulary: jest.fn(),
    updateUserCollection: jest.fn(),
    deleteUserCollection: jest.fn(),
  };
  const controller = new CollectionsController(service as never);
  const request = { user: { id: 'user-id' } } as never;

  beforeEach(() => jest.clearAllMocks());

  it('delegates every collection operation with the authenticated user', async () => {
    const body = { name: 'Words' } as never;
    const importBody = {
      catalogDefinitionIds: ['definition-id'],
      targetCollectionId: 'target-id',
      limit: 20,
      offset: 0,
    } as never;
    const oxfordBody = { catalogDefinitionIds: ['definition-id'] } as never;

    await Promise.all([
      controller.list(request),
      controller.create(request, body),
      controller.getOxfordMeta(request, 'A1'),
      controller.getOxfordProgressSummary(request, 'A1'),
      controller.getOxfordPart('A1', 2),
      controller.importOxfordPart(request, 'A1', 2, oxfordBody),
      controller.getCatalogWords(request, 'collection-id', {
        limit: 20,
        offset: 0,
      }),
      controller.get(request, 'collection-id'),
      controller.importToVocabulary(request, 'collection-id', importBody),
      controller.update(request, 'collection-id', body),
      controller.delete(request, 'collection-id'),
    ]);

    expect(service.list).toHaveBeenCalledWith('user-id');
    expect(service.createUserCollection).toHaveBeenCalledWith('user-id', body);
    expect(service.getOxfordMeta).toHaveBeenCalledWith('user-id', 'A1');
    expect(service.getOxfordProgressSummary).toHaveBeenCalledWith(
      'user-id',
      'A1',
    );
    expect(service.getOxfordPart).toHaveBeenCalledWith('A1', 2);
    expect(service.importOxfordPart).toHaveBeenCalledWith(
      'user-id',
      'A1',
      2,
      ['definition-id'],
      undefined,
    );
    expect(service.getCatalogWordsPage).toHaveBeenCalledWith(
      'user-id',
      'collection-id',
      { limit: 20, offset: 0 },
    );
    expect(service.get).toHaveBeenCalledWith('user-id', 'collection-id');
    expect(service.importToVocabulary).toHaveBeenCalledWith(
      'user-id',
      'collection-id',
      {
        catalogDefinitionIds: ['definition-id'],
        targetCollectionId: 'target-id',
        limit: 20,
        offset: 0,
      },
    );
    expect(service.updateUserCollection).toHaveBeenCalledWith(
      'user-id',
      'collection-id',
      body,
    );
    expect(service.deleteUserCollection).toHaveBeenCalledWith(
      'user-id',
      'collection-id',
    );
  });
});
