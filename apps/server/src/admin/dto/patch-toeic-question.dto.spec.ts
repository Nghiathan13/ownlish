import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatchToeicQuestionDto } from './patch-toeic-question.dto';

const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

async function validatePatchToeicQuestionDto(body: unknown) {
  const dto = plainToInstance(PatchToeicQuestionDto, body);
  return validate(dto, VALIDATION_PIPE_OPTIONS);
}

describe('PatchToeicQuestionDto', () => {
  it('accepts partial question fields', async () => {
    const errors = await validatePatchToeicQuestionDto({
      answerKey: 'B',
    });

    expect(errors).toHaveLength(0);
  });

  it('accepts nullable question fields', async () => {
    const errors = await validatePatchToeicQuestionDto({
      question: null,
      explanationVi: '',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects unknown fields', async () => {
    const errors = await validatePatchToeicQuestionDto({
      answerKey: 'B',
      id: 1001,
      questionNumber: 33,
      groupId: 101,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'id')).toBe(true);
    expect(errors.some((error) => error.property === 'questionNumber')).toBe(
      true,
    );
  });
});
