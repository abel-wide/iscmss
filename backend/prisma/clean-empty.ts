import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ባዶ የሆኑ መረጃዎችን ማጥፋት (email, passwordHash, fullName ባዶ የሆኑትን)
  const result = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: '' },
        { passwordHash: '' },
        { fullName: '' },
      ],
    },
  });

  console.log(`✅ Deleted ${result.count} empty records.`);
}

main().catch((e) => console.error(e)).finally(() => prisma.$disconnect());