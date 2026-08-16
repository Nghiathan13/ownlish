import { ExperienceEventKind } from '@prisma/client';
import type { ExperienceAward } from '../experience-awarder';
import {
  EXPERIENCE_DAILY_CAP,
  EXPERIENCE_MILESTONE_SIZE,
  EXPERIENCE_XP,
} from './experience.constants';
import type { ExperienceAwardPlan } from './experience-award.types';

export function getExperienceAwardPlan(
  experienceAward: ExperienceAward,
): ExperienceAwardPlan {
  switch (experienceAward.type) {
    case 'correct-answer':
      return getCorrectAnswerPlan(experienceAward);
    case 'mock-part':
      return {
        event: {
          kind: ExperienceEventKind.MOCK_PART,
          maxEvents: EXPERIENCE_DAILY_CAP.mockParts,
          subjectKey: `${experienceAward.testKey}:part:${experienceAward.partNumber}`,
          xp: EXPERIENCE_XP.mockPart,
        },
      };
    case 'dictation-segment':
      return {
        event: {
          kind: ExperienceEventKind.DICTATION_SEGMENT,
          maxEvents: EXPERIENCE_DAILY_CAP.dictationSegments,
          subjectKey: `${experienceAward.videoId}:segment:${experienceAward.segmentId}`,
          xp: EXPERIENCE_XP.dictationSegment,
        },
      };
    case 'dictation-video':
      return {
        event: {
          kind: ExperienceEventKind.DICTATION_VIDEO,
          maxEvents: EXPERIENCE_DAILY_CAP.dictationVideos,
          subjectKey: experienceAward.videoId,
          xp: EXPERIENCE_XP.dictationVideo,
        },
      };
    case 'review-easy':
      return {
        event: {
          kind: ExperienceEventKind.REVIEW_EASY,
          maxEvents: EXPERIENCE_DAILY_CAP.reviewEasy,
          subjectKey: `${experienceAward.source}:${experienceAward.subjectId}`,
          xp: EXPERIENCE_XP.reviewEasy,
        },
      };
  }
}

function getCorrectAnswerPlan(
  experienceAward: Extract<ExperienceAward, { type: 'correct-answer' }>,
): ExperienceAwardPlan {
  const isMock = experienceAward.bucket === 'mock';

  return {
    event: {
      kind: isMock
        ? ExperienceEventKind.MOCK_CORRECT
        : ExperienceEventKind.TEST_CORRECT,
      maxEvents: EXPERIENCE_DAILY_CAP.correctAnswers,
      subjectKey: experienceAward.questionKey,
      xp: EXPERIENCE_XP.correctAnswer,
    },
    milestone: {
      kind: isMock
        ? ExperienceEventKind.MOCK_MILESTONE
        : ExperienceEventKind.TEST_MILESTONE,
      size: EXPERIENCE_MILESTONE_SIZE,
      xp: EXPERIENCE_XP.correctMilestone,
    },
  };
}
