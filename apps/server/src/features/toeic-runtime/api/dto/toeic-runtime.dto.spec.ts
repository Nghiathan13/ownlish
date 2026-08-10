import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateToeicRuntimePartPracticeRunDto } from './create-part-practice-run.dto';
import { CreateToeicRuntimeTestRunDto } from './create-test-run.dto';
import { SelectToeicRuntimeMockRunDto } from './select-mock-run.dto';
import { SubmitToeicRuntimeAnswerDto } from './submit-answer.dto';
import { UpdateMockTimerDto } from './update-mock-timer.dto';

async function isValid(type: new () => object, value: object) {
  return (await validate(plainToInstance(type, value))).length === 0;
}

describe('TOEIC runtime DTOs', () => {
  it('validates part-practice and timer ranges', async () => {
    await expect(
      isValid(CreateToeicRuntimePartPracticeRunDto, { partNumber: 7 }),
    ).resolves.toBe(true);
    await expect(
      isValid(CreateToeicRuntimePartPracticeRunDto, { partNumber: 8 }),
    ).resolves.toBe(false);
    await expect(
      isValid(UpdateMockTimerDto, { remainingSeconds: 0 }),
    ).resolves.toBe(true);
    await expect(
      isValid(UpdateMockTimerDto, { remainingSeconds: -1 }),
    ).resolves.toBe(false);
  });

  it('accepts a valid test or mock selection and rejects duplicate parts', async () => {
    const payload = {
      testKey: 'ets19-t01',
      partNumbers: [1, 2],
      timeLimitMinutes: 60,
    };
    await expect(
      isValid(CreateToeicRuntimeTestRunDto, { ...payload, mode: 'mock_test' }),
    ).resolves.toBe(true);
    await expect(isValid(SelectToeicRuntimeMockRunDto, payload)).resolves.toBe(
      true,
    );
    await expect(
      isValid(CreateToeicRuntimeTestRunDto, {
        ...payload,
        partNumbers: [1, 1],
      }),
    ).resolves.toBe(false);
    await expect(
      isValid(SelectToeicRuntimeMockRunDto, { ...payload, testKey: 'test-1' }),
    ).resolves.toBe(false);
  });

  it('validates submitted answer keys and optional remaining time', async () => {
    await expect(
      isValid(SubmitToeicRuntimeAnswerDto, {
        questionKey: 'ets19-t01-p4-q071',
        selectedKey: 'A',
        mode: 'review_wrong',
        remainingSeconds: 0,
      }),
    ).resolves.toBe(true);
    await expect(
      isValid(SubmitToeicRuntimeAnswerDto, {
        questionKey: 'ets19-t01-p8-q071',
        selectedKey: 'E',
        remainingSeconds: -1,
      }),
    ).resolves.toBe(false);
  });
});
