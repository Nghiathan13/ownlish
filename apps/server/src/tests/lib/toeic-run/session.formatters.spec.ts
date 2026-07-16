import { ToeicRunGroupStatus, ToeicRunQuestionStatus } from '@prisma/client';
import {
  formatToeicGroupStatus,
  formatToeicQuestionCorrectness,
  formatToeicQuestionStatus,
} from './session.formatters';

describe('session.formatters', () => {
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
      expect(formatToeicQuestionCorrectness(ToeicRunQuestionStatus.RIGHT)).toBe(
        true,
      );
      expect(formatToeicQuestionCorrectness(ToeicRunQuestionStatus.WRONG)).toBe(
        false,
      );
      expect(formatToeicQuestionCorrectness(null)).toBeNull();
    });
  });
});
