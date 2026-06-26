import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatchToeicGroupRawDto } from './patch-toeic-group-raw.dto';

async function validatePatchToeicGroupRawDto(body: unknown) {
  const dto = plainToInstance(PatchToeicGroupRawDto, body);
  return validate(dto);
}

function getPropertyNames(errors: Awaited<ReturnType<typeof validate>>) {
  return errors.map((error) => error.property);
}

describe('PatchToeicGroupRawDto', () => {
  const validBody = {
    group: {
      content: 'Updated passage',
    },
    questions: [
      {
        id: 1001,
        question: 'Updated question',
      },
    ],
  };

  it('accepts a valid patch payload', async () => {
    const errors = await validatePatchToeicGroupRawDto(validBody);
    expect(errors).toHaveLength(0);
  });

  it('rejects missing group', async () => {
    const errors = await validatePatchToeicGroupRawDto({
      questions: [],
    });

    expect(getPropertyNames(errors)).toContain('group');
  });

  it('rejects missing questions', async () => {
    const errors = await validatePatchToeicGroupRawDto({
      group: {},
    });

    expect(getPropertyNames(errors)).toContain('questions');
  });

  it('rejects non-array questions', async () => {
    const errors = await validatePatchToeicGroupRawDto({
      group: {},
      questions: 'invalid',
    });

    expect(getPropertyNames(errors)).toContain('questions');
  });
});
