import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateUserInput = {
  email: string;
  passwordHash: string;
  name?: string;
};

type UserResult = ReturnType<PrismaService['user']['findUnique']>;
type CreatedUserResult = ReturnType<PrismaService['user']['create']>;

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
    return this.prisma.user.create({
      data: input,
    });
  }
}
