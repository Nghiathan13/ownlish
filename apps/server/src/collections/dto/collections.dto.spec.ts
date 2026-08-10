import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CatalogWordsQueryDto } from './catalog-words-query.dto';
import { CreateUserCollectionDto } from './create-user-collection.dto';
import { ImportCollectionDto } from './import-collection.dto';
import { ImportOxfordPartDto } from './import-oxford-part.dto';
import { UpdateUserCollectionDto } from './update-user-collection.dto';

const validationOptions = { whitelist: true, forbidNonWhitelisted: true };
const collectionId = '2ee085f0-b0b5-4ae9-94f5-abf1b7e3e7dc';

async function errors(type: new () => object, value: object) {
  return validate(plainToInstance(type, value), validationOptions);
}

describe('collection DTOs', () => {
  it('transforms and bounds catalog pagination', async () => {
    const instance = plainToInstance(CatalogWordsQueryDto, {
      offset: '0',
      limit: '20',
    });
    expect(instance).toMatchObject({ offset: 0, limit: 20 });
    expect(await errors(CatalogWordsQueryDto, instance)).toHaveLength(0);
    expect(await errors(CatalogWordsQueryDto, { limit: 21 })).not.toHaveLength(
      0,
    );
  });

  it('validates collection create and update payloads', async () => {
    expect(
      await errors(CreateUserCollectionDto, { name: 'My words' }),
    ).toHaveLength(0);
    expect(
      await errors(UpdateUserCollectionDto, { name: 'Renamed' }),
    ).toHaveLength(0);
    expect(
      await errors(CreateUserCollectionDto, { name: '' }),
    ).not.toHaveLength(0);
    expect(await errors(UpdateUserCollectionDto, { name: 1 })).not.toHaveLength(
      0,
    );
  });

  it('validates optional catalog imports and required Oxford words', async () => {
    expect(
      await errors(ImportCollectionDto, {
        targetCollectionId: collectionId,
        catalogDefinitionIds: ['entry-1'],
        offset: '0',
        limit: '20',
      }),
    ).toHaveLength(0);
    expect(
      await errors(ImportCollectionDto, { targetCollectionId: 'not-a-uuid' }),
    ).not.toHaveLength(0);
    expect(
      await errors(ImportOxfordPartDto, {
        targetCollectionId: collectionId,
        catalogDefinitionIds: ['entry-1'],
      }),
    ).toHaveLength(0);
    expect(
      await errors(ImportOxfordPartDto, { catalogDefinitionIds: [] }),
    ).not.toHaveLength(0);
  });
});
