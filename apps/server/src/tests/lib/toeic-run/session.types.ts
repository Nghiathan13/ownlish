import { ToeicRunMode } from '@prisma/client';

export type ToeicSessionResponseMode =
  | 'practice'
  | 'review_wrong'
  | 'mock_test';

export type ToeicRunForResponse = {
  id: string;
  mode: ToeicRunMode;
  toeicTestId: number;
  selectedParts: number[];
  totalRight: number;
  totalWrong: number;
  completedAt: Date | null;
};

export type FormatToeicSessionResponseOptions = {
  year: number;
  mode?: ToeicSessionResponseMode;
};
