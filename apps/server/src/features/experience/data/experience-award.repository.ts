import { Injectable } from '@nestjs/common';
import { Prisma, type ExperienceEventKind } from '@prisma/client';
import type { ExperienceLedgerEvent } from '../model/experience-award.types';

type Transaction = Prisma.TransactionClient;

@Injectable()
export class ExperienceAwardRepository {
  async lockUserDay(tx: Transaction, userId: string, learnedOn: Date) {
    await tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${`experience:${learnedOn.toISOString().slice(0, 10)}`}))`,
    );
  }

  async hasEvent(
    tx: Transaction,
    input: {
      userId: string;
      learnedOn: Date;
      kind: ExperienceEventKind;
      subjectKey: string;
    },
  ) {
    const event = await tx.experienceEvent.findUnique({
      where: {
        userId_learnedOn_kind_subjectKey: input,
      },
      select: { id: true },
    });

    return Boolean(event);
  }

  countEvents(
    tx: Transaction,
    input: { userId: string; learnedOn: Date; kind: ExperienceEventKind },
  ) {
    return tx.experienceEvent.count({ where: input });
  }

  async recordEvent(
    tx: Transaction,
    input: {
      userId: string;
      learnedOn: Date;
      event: ExperienceLedgerEvent;
    },
  ) {
    await tx.experienceEvent.create({
      data: {
        userId: input.userId,
        learnedOn: input.learnedOn,
        kind: input.event.kind,
        subjectKey: input.event.subjectKey,
        xp: input.event.xp,
      },
    });
    await tx.userExperience.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, totalXp: input.event.xp },
      update: { totalXp: { increment: input.event.xp } },
    });
  }
}
