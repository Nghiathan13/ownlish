import { Injectable } from '@nestjs/common';
import { Prisma, ToeicRunMode } from '@prisma/client';
import type { ToeicRunForResponse } from './session.types';
import { ToeicRunRepository } from './repository';

@Injectable()
export class ToeicRunMaterializer {
  constructor(private readonly runRepository: ToeicRunRepository) {}

  async findOrCreatePracticeRun(input: {
    userId: string;
    testId: number;
    selectedParts: number[];
  }): Promise<ToeicRunForResponse> {
    return this.runRepository.transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${input.userId}), ${input.testId})`,
      );
      const existingRun = await tx.toeicRun.findFirst({
        where: {
          userId: input.userId,
          toeicTestId: input.testId,
          mode: ToeicRunMode.PRACTICE,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          mode: true,
          toeicTestId: true,
          selectedParts: true,
          totalRight: true,
          totalWrong: true,
          completedAt: true,
        },
      });

      if (!existingRun) {
        return tx.toeicRun.create({
          data: {
            userId: input.userId,
            toeicTestId: input.testId,
            mode: ToeicRunMode.PRACTICE,
            selectedParts: input.selectedParts,
          },
        });
      }

      const selectedParts = [
        ...new Set([...existingRun.selectedParts, ...input.selectedParts]),
      ].sort((a, b) => a - b);
      if (selectedParts.join(',') === existingRun.selectedParts.join(',')) {
        return existingRun;
      }

      return tx.toeicRun.update({
        where: { id: existingRun.id },
        data: { selectedParts },
        select: {
          id: true,
          mode: true,
          toeicTestId: true,
          selectedParts: true,
          totalRight: true,
          totalWrong: true,
          completedAt: true,
        },
      });
    });
  }

  createRun(input: {
    userId: string;
    testId: number;
    mode: ToeicRunMode;
    selectedParts: number[];
  }): Promise<ToeicRunForResponse> {
    return this.runRepository.transaction((tx) =>
      tx.toeicRun.create({
        data: {
          userId: input.userId,
          toeicTestId: input.testId,
          mode: input.mode,
          selectedParts: input.selectedParts,
        },
      }),
    );
  }
}
