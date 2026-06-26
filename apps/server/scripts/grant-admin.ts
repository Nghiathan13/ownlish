import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';

function getEmailArg(): string | null {
  const emailIndex = process.argv.indexOf('--email');

  if (emailIndex === -1) {
    return null;
  }

  const email = process.argv[emailIndex + 1]?.trim();

  return email ? email : null;
}

async function main() {
  const email = getEmailArg();

  if (!email) {
    console.error('Usage: pnpm admin:grant --email admin@example.com');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.error(`User not found: ${normalizedEmail}`);
      process.exit(1);
    }

    if (user.role === UserRole.ADMIN) {
      console.log(`User already has ADMIN role: ${normalizedEmail}`);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });

    console.log(`Granted ADMIN role to ${normalizedEmail}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
