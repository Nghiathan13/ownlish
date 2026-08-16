import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVocabWordDto } from './create-vocab-word.dto';
import { ListDueReviewWordsDto } from './list-due-review-words.dto';
import { GetVocabStatsDto, ListVocabWordsDto } from './list-vocab-words.dto';
import { UpdateVocabReviewDto } from './update-vocab-review.dto';

const collectionId = '2ee085f0-b0b5-4ae9-94f5-abf1b7e3e7dc';

async function isValid(type: new () => object, value: object) {
  return (await validate(plainToInstance(type, value))).length === 0;
}

describe('vocabulary DTOs', () => {
  it('validates a vocabulary entry and its numeric bounds', async () => {
    await expect(
      isValid(CreateVocabWordDto, {
        collectionId,
        word: 'learn',
        level: 7,
        wrongCount: 0,
      }),
    ).resolves.toBe(true);
    await expect(
      isValid(CreateVocabWordDto, {
        collectionId: 'bad',
        word: '',
        level: 8,
        wrongCount: -1,
      }),
    ).resolves.toBe(false);
  });

  it('transforms and validates list pagination', async () => {
    const due = plainToInstance(ListDueReviewWordsDto, {
      collectionId,
      limit: '1000',
      offset: '0',
    });
    expect(due).toMatchObject({ limit: 1000, offset: 0 });
    await expect(validate(due)).resolves.toHaveLength(0);
    await expect(
      isValid(ListVocabWordsDto, { collectionId, search: 'word', limit: 501 }),
    ).resolves.toBe(false);
    await expect(isValid(GetVocabStatsDto, { collectionId })).resolves.toBe(
      true,
    );
  });

  it('accepts supported review ratings only', async () => {
    await expect(
      isValid(UpdateVocabReviewDto, {
        rating: 'GOOD',
        submissionId: '11111111-1111-4111-8111-111111111111',
      }),
    ).resolves.toBe(true);
    await expect(
      isValid(UpdateVocabReviewDto, {
        rating: 'later',
        submissionId: 'invalid',
      }),
    ).resolves.toBe(false);
  });
});
