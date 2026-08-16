import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SubmitDictationAnswerDto } from './submit-dictation-answer.dto';

describe('SubmitDictationAnswerDto', () => {
  it('accepts a segment identifier and typed answer', async () => {
    await expect(
      validate(
        plainToInstance(SubmitDictationAnswerDto, {
          segmentId: 's12',
          answer: 'Hello world',
        }),
      ),
    ).resolves.toHaveLength(0);
  });

  it('rejects non-segment identifiers and missing typed answers', async () => {
    await expect(
      validate(
        plainToInstance(SubmitDictationAnswerDto, {
          segmentId: 'segment-12',
          answer: undefined,
        }),
      ),
    ).resolves.not.toHaveLength(0);
  });
});
