import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ExperienceSummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalXp(userId: string) {
    const experience = await this.prisma.userExperience.findUnique({
      where: { userId },
      select: { totalXp: true },
    });

    return experience?.totalXp ?? 0;
  }
}
