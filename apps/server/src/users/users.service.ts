import { UserRole } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { WordCollectionKind } from '@prisma/client';
import { DEFAULT_USER_COLLECTION_NAME } from '../collections/collections.constants';
import { PrismaService } from '../prisma/prisma.service';

type CreateUserInput = {
  email: string;
  passwordHash?: string | null;
  googleSub?: string | null;
  name?: string;
};

type UserResult = ReturnType<PrismaService['user']['findUnique']>;
type CreatedUserResult = Promise<{
  id: string;
  email: string;
  passwordHash: string | null;
  googleSub: string | null;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): UserResult {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findByGoogleSub(googleSub: string): UserResult {
    return this.prisma.user.findUnique({
      where: { googleSub },
    });
  }

  findById(id: string): UserResult {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(input: CreateUserInput): CreatedUserResult {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash ?? null,
          googleSub: input.googleSub ?? null,
          name: input.name,
        },
      });

      await tx.wordCollection.create({
        data: {
          ownerUserId: user.id,
          name: DEFAULT_USER_COLLECTION_NAME,
          kind: WordCollectionKind.USER,
          isDefault: true,
          isPublic: false,
        },
      });

      return user;
    });
  }

  linkGoogleSub(
    userId: string,
    googleSub: string,
    options?: { name?: string | null },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleSub,
        ...(options?.name ? { name: options.name } : {}),
      },
    });
  }
}
