import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SubmitDictationAnswerDto } from './submit-dictation-answer.dto';

describe('SubmitDictationAnswerDto', () => {
  it('accepts a segment identifier and completion status', async () => {
    await expect(
      validate(
        plainToInstance(SubmitDictationAnswerDto, {
          segmentId: 's12',
          isCompleted: true,
        }),
      ),
    ).resolves.toHaveLength(0);
  });

  it('rejects non-segment identifiers and non-boolean completion status', async () => {
    await expect(
      validate(
        plainToInstance(SubmitDictationAnswerDto, {
          segmentId: 'segment-12',
          isCompleted: 'true',
        }),
      ),
    ).resolves.not.toHaveLength(0);
  });
});
