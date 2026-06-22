import { Injectable } from '@nestjs/common';
import { WordCollectionKind } from '@prisma/client';
import { DEFAULT_USER_COLLECTION_NAME } from '../collections/collections.constants';
import { PrismaService } from '../prisma/prisma.service';

type CreateUserInput = {
  email: string;
  passwordHash: string;
  name?: string;
};

type UserResult = ReturnType<PrismaService['user']['findUnique']>;
type CreatedUserResult = Promise<{
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
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

  findById(id: string): UserResult {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(input: CreateUserInput): CreatedUserResult {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: input,
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
}
