import {
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
} from '@prisma/client';
import {
  formatToeicGroupStatus,
  formatToeicQuestionCorrectness,
  formatToeicQuestionStatus,
  formatToeicRunMode,
  isWrongReviewToeicGroup,
} from './toeic-run-session.formatters';
import type { ToeicRunGroupForResponse } from './toeic-run-session.types';

describe('toeic-run-session.formatters', () => {
  describe('formatToeicRunMode', () => {
    it('maps mock test mode to mock_test', () => {
      expect(formatToeicRunMode(ToeicRunMode.MOCK_TEST)).toBe('mock_test');
    });

    it('maps practice mode to practice', () => {
      expect(formatToeicRunMode(ToeicRunMode.PRACTICE)).toBe('practice');
    });
  });

  describe('formatToeicGroupStatus', () => {
    it('maps group statuses to API values', () => {
      expect(formatToeicGroupStatus(ToeicRunGroupStatus.RIGHT)).toBe('right');
      expect(formatToeicGroupStatus(ToeicRunGroupStatus.WRONG)).toBe('wrong');
      expect(formatToeicGroupStatus(null)).toBeNull();
    });
  });

  describe('formatToeicQuestionStatus', () => {
    it('maps question statuses to API values', () => {
      expect(formatToeicQuestionStatus(ToeicRunQuestionStatus.SELECTED)).toBe(
        'selected',
      );
      expect(formatToeicQuestionStatus(ToeicRunQuestionStatus.RIGHT)).toBe(
        'right',
      );
      expect(formatToeicQuestionStatus(ToeicRunQuestionStatus.WRONG)).toBe(
        'wrong',
      );
      expect(formatToeicQuestionStatus(null)).toBeNull();
    });
  });

  describe('formatToeicQuestionCorrectness', () => {
    it('maps graded question statuses to booleans', () => {
      expect(
        formatToeicQuestionCorrectness(ToeicRunQuestionStatus.RIGHT),
      ).toBe(true);
      expect(
        formatToeicQuestionCorrectness(ToeicRunQuestionStatus.WRONG),
      ).toBe(false);
      expect(formatToeicQuestionCorrectness(null)).toBeNull();
    });
  });

  describe('isWrongReviewToeicGroup', () => {
    const baseGroup: ToeicRunGroupForResponse = {
      toeicQuestionGroupId: 1,
      partNumber: 1,
      questionStart: 1,
      questionEnd: 1,
      sortOrder: 0,
      status: null,
      toeicQuestionGroup: {
        id: 1,
        groupType: null,
        accent: null,
        content: null,
        contentVi: null,
        audioStoragePath: null,
        imageStoragePath: null,
      },
      questions: [],
    };

    it('returns true when group status is wrong', () => {
      expect(
        isWrongReviewToeicGroup({
          ...baseGroup,
          status: ToeicRunGroupStatus.WRONG,
        }),
      ).toBe(true);
    });

    it('returns true when any question in the group is wrong', () => {
      expect(
        isWrongReviewToeicGroup({
          ...baseGroup,
          questions: [
            {
              toeicQuestionId: 1,
              selectedKey: 'A',
              status: ToeicRunQuestionStatus.WRONG,
              toeicQuestion: {} as ToeicRunGroupForResponse['questions'][number]['toeicQuestion'],
            },
          ],
        }),
      ).toBe(true);
    });

    it('returns false when group and questions are not wrong', () => {
      expect(
        isWrongReviewToeicGroup({
          ...baseGroup,
          questions: [
            {
              toeicQuestionId: 1,
              selectedKey: 'A',
              status: ToeicRunQuestionStatus.RIGHT,
              toeicQuestion: {} as ToeicRunGroupForResponse['questions'][number]['toeicQuestion'],
            },
          ],
        }),
      ).toBe(false);
    });
  });
});
