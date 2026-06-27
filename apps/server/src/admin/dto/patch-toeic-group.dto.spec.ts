import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatchToeicGroupDto } from './patch-toeic-group.dto';

const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

async function validatePatchToeicGroupDto(body: unknown) {
  const dto = plainToInstance(PatchToeicGroupDto, body);
  return validate(dto, VALIDATION_PIPE_OPTIONS);
}

describe('PatchToeicGroupDto', () => {
  it('accepts partial group fields', async () => {
    const errors = await validatePatchToeicGroupDto({
      content: 'Updated',
    });

    expect(errors).toHaveLength(0);
  });

  it('accepts nullable group fields', async () => {
    const errors = await validatePatchToeicGroupDto({
      content: null,
      contentVi: '',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects unknown fields', async () => {
    const errors = await validatePatchToeicGroupDto({
      content: 'Updated',
      id: 101,
      questionStart: 1,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'id')).toBe(true);
  });
});
