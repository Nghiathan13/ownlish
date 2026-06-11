import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateUserInput = {
  email: string;
  passwordHash: string;
  name?: string;
};

type UserResult = ReturnType<PrismaService['user']['findUnique']>;
type CreatedUserResult = ReturnType<PrismaService['user']['create']>;
type UpdatedUserResult = ReturnType<PrismaService['user']['update']>;

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

  findByRefreshTokenHash(refreshTokenHash: string): UserResult {
    return this.prisma.user.findUnique({
      where: { refreshTokenHash },
    });
  }

  create(input: CreateUserInput): CreatedUserResult {
    return this.prisma.user.create({
      data: input,
    });
  }

  updateRefreshToken(
    id: string,
    input: {
      refreshTokenHash: string;
      refreshTokenExpiresAt: Date;
    },
  ): UpdatedUserResult {
    return this.prisma.user.update({
      where: { id },
      data: input,
    });
  }

  clearRefreshToken(id: string): UpdatedUserResult {
    return this.prisma.user.update({
      where: { id },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }
}
