import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getVietnamLearningDay } from '../../../common/lib/vietnam-learning-day';
import type { ExperienceAward, ExperienceAwarder } from '../experience-awarder';
import { ExperienceAwardRepository } from '../data/experience-award.repository';
import { getExperienceAwardPlan } from './experience-award-policy';
import type {
  ExperienceAwardEvent,
  ExperienceLedgerEvent,
} from './experience-award.types';

type Transaction = Prisma.TransactionClient;

@Injectable()
export class ExperienceAwardService implements ExperienceAwarder {
  constructor(
    private readonly experienceAwardRepository: ExperienceAwardRepository,
  ) {}

  async award(tx: Transaction, experienceAward: ExperienceAward) {
    const day = getVietnamLearningDay(new Date());
    await this.experienceAwardRepository.lockUserDay(
      tx,
      experienceAward.userId,
      day,
    );

    const plan = getExperienceAwardPlan(experienceAward);
    const awardedXp = await this.awardCapped(tx, {
      day,
      event: plan.event,
      userId: experienceAward.userId,
    });
    if (!awardedXp || !plan.milestone) {
      return awardedXp;
    }

    const count = await this.experienceAwardRepository.countEvents(tx, {
      userId: experienceAward.userId,
      learnedOn: day,
      kind: plan.event.kind,
    });
    if (count % plan.milestone.size !== 0) {
      return awardedXp;
    }

    return (
      awardedXp +
      (await this.recordEvent(tx, {
        day,
        event: {
          kind: plan.milestone.kind,
          subjectKey: `milestone:${count}`,
          xp: plan.milestone.xp,
        },
        userId: experienceAward.userId,
      }))
    );
  }

  private async awardCapped(
    tx: Transaction,
    input: {
      day: Date;
      event: ExperienceAwardEvent;
      userId: string;
    },
  ) {
    if (
      await this.experienceAwardRepository.hasEvent(tx, {
        userId: input.userId,
        learnedOn: input.day,
        kind: input.event.kind,
        subjectKey: input.event.subjectKey,
      })
    ) {
      return 0;
    }

    const count = await this.experienceAwardRepository.countEvents(tx, {
      userId: input.userId,
      learnedOn: input.day,
      kind: input.event.kind,
    });
    if (count >= input.event.maxEvents) {
      return 0;
    }

    return this.recordEvent(tx, input);
  }

  private async recordEvent(
    tx: Transaction,
    input: {
      day: Date;
      event: ExperienceLedgerEvent;
      userId: string;
    },
  ) {
    await this.experienceAwardRepository.recordEvent(tx, {
      userId: input.userId,
      learnedOn: input.day,
      event: input.event,
    });

    return input.event.xp;
  }
}
