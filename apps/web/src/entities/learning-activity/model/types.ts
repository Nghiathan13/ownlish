export const LEARNING_ACTIVITY_TYPES = {
  TEST_PRACTICE: "TEST_PRACTICE",
  TEST_REVIEW_WRONG: "TEST_REVIEW_WRONG",
  TEST_PART_PRACTICE: "TEST_PART_PRACTICE",
  TEST_PART_PRACTICE_REVIEW_WRONG: "TEST_PART_PRACTICE_REVIEW_WRONG",
  TEST_MOCK: "TEST_MOCK",
  DICTATION: "DICTATION",
  VOCABULARY_REVIEW: "VOCABULARY_REVIEW",
} as const;

export type LearningActivityType =
  (typeof LEARNING_ACTIVITY_TYPES)[keyof typeof LEARNING_ACTIVITY_TYPES];

export type LearningActivityCheckpointKind = "heartbeat" | "flush";

export const LEARNING_ACTIVITY_CALENDAR_MODES = {
  ALL: "all",
  DICTATION: "dictation",
  MOCK: "mock",
  PART_PRACTICE: "part_practice",
  PRACTICE: "practice",
  REVIEW: "review",
} as const;

export type LearningActivityCalendarMode =
  (typeof LEARNING_ACTIVITY_CALENDAR_MODES)[keyof typeof LEARNING_ACTIVITY_CALENDAR_MODES];

export type LearningActivityCalendar = {
  days: LearningActivityCalendarDay[];
};

export type LearningActivityCalendarDay = {
  activityType: LearningActivityType;
  learnedOn: string;
  seconds: number;
};
