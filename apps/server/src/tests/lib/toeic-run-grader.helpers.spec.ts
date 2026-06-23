import { ToeicRunQuestionStatus } from '@prisma/client';
import { isToeicRunGroupReadyToGrade } from './toeic-run-grader.helpers';

describe('toeic-run-grader.helpers', () => {
  describe('isToeicRunGroupReadyToGrade', () => {
    it('returns true when every question has a selection in practice mode', () => {
      expect(
        isToeicRunGroupReadyToGrade([
          { selectedKey: 'A', status: ToeicRunQuestionStatus.SELECTED },
          { selectedKey: 'B', status: ToeicRunQuestionStatus.SELECTED },
        ]),
      ).toBe(true);
    });

    it('treats already-right questions as satisfied in review wrong mode', () => {
      expect(
        isToeicRunGroupReadyToGrade(
          [
            { selectedKey: 'A', status: ToeicRunQuestionStatus.RIGHT },
            { selectedKey: 'C', status: ToeicRunQuestionStatus.SELECTED },
          ],
          true,
        ),
      ).toBe(true);
    });

    it('requires every non-right question to be selected again in review wrong mode', () => {
      expect(
        isToeicRunGroupReadyToGrade(
          [
            { selectedKey: 'A', status: ToeicRunQuestionStatus.RIGHT },
            { selectedKey: 'D', status: ToeicRunQuestionStatus.WRONG },
          ],
          true,
        ),
      ).toBe(false);
    });

    it('returns false for an empty group', () => {
      expect(isToeicRunGroupReadyToGrade([])).toBe(false);
    });
  });
});
