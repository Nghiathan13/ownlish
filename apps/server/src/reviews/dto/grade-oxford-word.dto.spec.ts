import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GradeOxfordWordDto } from './grade-oxford-word.dto';

describe('GradeOxfordWordDto', () => {
  it('accepts supported ratings and rejects unknown ratings', async () => {
    await expect(
      validate(plainToInstance(GradeOxfordWordDto, { rating: 'GOOD' })),
    ).resolves.toHaveLength(0);
    await expect(
      validate(plainToInstance(GradeOxfordWordDto, { rating: 'unknown' })),
    ).resolves.not.toHaveLength(0);
  });
});
