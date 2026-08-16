import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  StudyTimeLeaderboardRange,
  StudyTimeLeaderboardRecord,
} from '../model/study-time-leaderboard.types';

const LEADERBOARD_LIMIT = 100;

@Injectable()
export class StudyTimeLeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  getEntries(range: StudyTimeLeaderboardRange | null) {
    const dateFilter = range
      ? Prisma.sql`
          WHERE daily."learned_on" >= ${range.startsOn}
            AND daily."learned_on" <= ${range.endsOn}
        `
      : Prisma.empty;

    return this.prisma.$queryRaw<StudyTimeLeaderboardRecord[]>`
      WITH totals AS (
        SELECT
          daily."user_id" AS "userId",
          SUM(daily."seconds")::int AS "studySeconds"
        FROM "user_learning_daily" daily
        ${dateFilter}
        GROUP BY daily."user_id"
        HAVING SUM(daily."seconds") > 0
      )
      SELECT
        RANK() OVER (ORDER BY totals."studySeconds" DESC)::int AS "rank",
        totals."userId",
        users."name" AS "name",
        users."avatar_url" AS "avatarUrl",
        users."avatar_storage_path" AS "avatarStoragePath",
        totals."studySeconds"
      FROM totals
      INNER JOIN "users" users ON users."id" = totals."userId"
      ORDER BY totals."studySeconds" DESC, users."id" ASC
      LIMIT ${LEADERBOARD_LIMIT}
    `;
  }
}
