import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateVocabWordDto } from './update-vocab-word.dto';

const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

describe('UpdateVocabWordDto', () => {
  it('accepts a UUID v4 definition id', async () => {
    const errors = await validate(
      plainToInstance(UpdateVocabWordDto, {
        definitionId: '2ee085f0-b0b5-4ae9-94f5-abf1b7e3e7dc',
      }),
      VALIDATION_PIPE_OPTIONS,
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects a legacy md5 definition id', async () => {
    const errors = await validate(
      plainToInstance(UpdateVocabWordDto, {
        definitionId: '1c6f26ba0e4f63fd2789b5fe9cb67b7e',
      }),
      VALIDATION_PIPE_OPTIONS,
    );

    expect(errors.some((error) => error.property === 'definitionId')).toBe(
      true,
    );
  });
});
