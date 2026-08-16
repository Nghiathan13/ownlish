import type { ExperienceEventKind } from '@prisma/client';
import type { ExperienceAward } from '../experience-awarder';

export type ExperienceAwardEvent = {
  kind: ExperienceEventKind;
  maxEvents: number;
  subjectKey: string;
  xp: number;
};

export type ExperienceLedgerEvent = Omit<ExperienceAwardEvent, 'maxEvents'>;

export type ExperienceAwardPlan = {
  event: ExperienceAwardEvent;
  milestone?: {
    kind: ExperienceEventKind;
    size: number;
    xp: number;
  };
};

export type { ExperienceAward };
