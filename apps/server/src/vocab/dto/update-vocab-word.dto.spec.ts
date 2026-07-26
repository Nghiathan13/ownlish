import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateVocabWordDto } from './update-vocab-word.dto';

const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

describe('UpdateVocabWordDto', () => {
  it('rejects the legacy definition id field', async () => {
    const errors = await validate(
      plainToInstance(UpdateVocabWordDto, {
        definitionId: '2ee085f0-b0b5-4ae9-94f5-abf1b7e3e7dc',
      }),
      VALIDATION_PIPE_OPTIONS,
    );

    expect(errors.some((error) => error.property === 'definitionId')).toBe(
      true,
    );
  });
});
