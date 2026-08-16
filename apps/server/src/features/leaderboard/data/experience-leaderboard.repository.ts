import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ExperienceLeaderboardRecord } from '../model/experience-leaderboard.types';

const LEADERBOARD_LIMIT = 100;

@Injectable()
export class ExperienceLeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  getEntries() {
    return this.prisma.$queryRaw<ExperienceLeaderboardRecord[]>`
      SELECT
        RANK() OVER (ORDER BY experience."total_xp" DESC)::int AS "rank",
        users."name" AS "name",
        users."avatar_url" AS "avatarUrl",
        users."avatar_storage_path" AS "avatarStoragePath",
        experience."total_xp"::int AS "experience"
      FROM "user_experience" experience
      INNER JOIN "users" users ON users."id" = experience."user_id"
      WHERE experience."total_xp" > 0
      ORDER BY experience."total_xp" DESC, users."id" ASC
      LIMIT ${LEADERBOARD_LIMIT}
    `;
  }
}
