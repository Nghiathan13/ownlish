import { ExperienceEventKind } from '@prisma/client';
import { getExperienceAwardPlan } from './experience-award-policy';

describe('getExperienceAwardPlan', () => {
  it('maps Test and Mock correct answers to separate event and milestone kinds', () => {
    expect(
      getExperienceAwardPlan({
        type: 'correct-answer',
        userId: 'user-id',
        questionKey: 'question-1',
        bucket: 'test',
      }),
    ).toMatchObject({
      event: {
        kind: ExperienceEventKind.TEST_CORRECT,
        subjectKey: 'question-1',
      },
      milestone: { kind: ExperienceEventKind.TEST_MILESTONE, size: 10, xp: 2 },
    });
    expect(
      getExperienceAwardPlan({
        type: 'correct-answer',
        userId: 'user-id',
        questionKey: 'question-1',
        bucket: 'mock',
      }),
    ).toMatchObject({
      event: { kind: ExperienceEventKind.MOCK_CORRECT },
      milestone: { kind: ExperienceEventKind.MOCK_MILESTONE },
    });
  });

  it('uses canonical Dictation and review subject keys with their caps', () => {
    expect(
      getExperienceAwardPlan({
        type: 'dictation-segment',
        userId: 'user-id',
        videoId: 'video-1',
        segmentId: 's001',
      }),
    ).toMatchObject({
      event: {
        kind: ExperienceEventKind.DICTATION_SEGMENT,
        subjectKey: 'video-1:segment:s001',
        maxEvents: 200,
        xp: 4,
      },
    });
    expect(
      getExperienceAwardPlan({
        type: 'review-easy',
        userId: 'user-id',
        source: 'oxford',
        subjectId: 'definition-1',
      }),
    ).toMatchObject({
      event: {
        kind: ExperienceEventKind.REVIEW_EASY,
        subjectKey: 'oxford:definition-1',
        maxEvents: 100,
        xp: 2,
      },
    });
  });
});
