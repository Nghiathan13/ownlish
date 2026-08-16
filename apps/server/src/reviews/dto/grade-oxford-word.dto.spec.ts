import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GradeOxfordWordDto } from './grade-oxford-word.dto';

describe('GradeOxfordWordDto', () => {
  it('accepts supported ratings and rejects unknown ratings', async () => {
    await expect(
      validate(
        plainToInstance(GradeOxfordWordDto, {
          rating: 'GOOD',
          submissionId: '11111111-1111-4111-8111-111111111111',
        }),
      ),
    ).resolves.toHaveLength(0);
    await expect(
      validate(
        plainToInstance(GradeOxfordWordDto, {
          rating: 'unknown',
          submissionId: 'invalid',
        }),
      ),
    ).resolves.not.toHaveLength(0);
  });
});
