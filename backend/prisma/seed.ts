import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config'; // .env ን ለማንበብ

// Adapter ፍጠር (እንደ PrismaService ሁሉ)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('Admin@1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@iscms.local' },
    update: {},
    create: {
      email: 'admin@iscms.local',
      passwordHash: password,
      fullName: 'System Administrator',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin seeded:', admin.email);
  console.log('📧 Email: admin@iscms.local');
  console.log('🔑 Password: Admin@1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });