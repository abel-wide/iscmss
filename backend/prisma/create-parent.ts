import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'parent1@iscms.local';
  const passwordHash = await bcrypt.hash('Parent@1234', 10);

  // ያለውን ወላጅ አጥፋ (ካለ)
  await prisma.user.deleteMany({ where: { email } });

  // አዲስ ወላጅ ፍጠር
  const parentUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: 'Test Parent',
      role: Role.PARENT,
      parent: {
        create: { relationship: 'Father' },
      },
    },
  });

  console.log('✅ Parent created successfully:', parentUser.email);
}

main().catch((e) => console.error(e)).finally(() => prisma.$disconnect());