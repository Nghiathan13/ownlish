import { Injectable } from '@nestjs/common';
import type { RefreshSession, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RefreshSessionWithUser = RefreshSession & {
  user: User;
};
type CreatedRefreshSessionResult = ReturnType<
  PrismaService['refreshSession']['create']
>;
type UpdatedRefreshSessionResult = ReturnType<
  PrismaService['refreshSession']['update']
>;

@Injectable()
export class RefreshSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): CreatedRefreshSessionResult {
    return this.prisma.refreshSession.create({
      data: input,
    });
  }

  findByTokenHash(tokenHash: string): Promise<RefreshSessionWithUser | null> {
    return this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });
  }

  async rotateIfCurrentTokenMatches(
    id: string,
    currentTokenHash: string,
    input: {
      tokenHash: string;
      expiresAt: Date;
    },
  ): Promise<boolean> {
    const { count } = await this.prisma.refreshSession.updateMany({
      where: {
        id,
        tokenHash: currentTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        ...input,
      },
    });

    return count === 1;
  }

  revoke(id: string): UpdatedRefreshSessionResult {
    return this.prisma.refreshSession.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
