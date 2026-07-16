import type { ToeicRun, ToeicRunMode } from '@prisma/client';

export type ToeicOwnedRunMeta = {
  id: string;
  mode: ToeicRunMode;
  toeicTestId: number;
  selectedParts: number[];
  totalRight: number;
  totalWrong: number;
  completedAt: Date | null;
};

export type ToeicOwnedRunRecord = Pick<
  ToeicRun,
  'id' | 'mode' | 'toeicTestId' | 'selectedParts' | 'completedAt'
>;

export type ToeicTestYear = {
  id: number;
  year: number;
};
