import { PrismaClient, Role, Gender } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import * as fs from 'fs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const parentUser = await prisma.user.findUnique({
    where: { email: 'parent1@iscms.local' },
    include: { parent: true },
  });

  if (!parentUser || !parentUser.parent) {
    console.log('❌ Parent not found. Run create-parent.ts first.');
    return;
  }

  const passwordHash = await bcrypt.hash('Student@1234', 10);

  // ተማሪውን ፍጠርና ከወላጁ ጋር አገናኝ (include: { student: true } መጨመርህን አረጋግጥ)
  const studentUser = await prisma.user.create({
    data: {
      email: `child-${Date.now()}@iscms.local`,
      passwordHash,
      fullName: 'Test Child',
      role: Role.STUDENT,
      student: {
        create: {
          studentCode: `STU-${Date.now()}`,
          dateOfBirth: new Date('2010-05-15'),
          gender: Gender.MALE,
          parentId: parentUser.parent.id,
        },
      },
    },
    include: { student: true }, // <-- ይህ መኖሩ በጣም አስፈላጊ ነው!
  });

  // የልጁን መረጃ ለ Frontend ለማስተላለፍ ወደ JSON ፋይል መፃፍ
  const studentData = {
    id: studentUser.student!.id,
    studentCode: studentUser.student!.studentCode,
    user: { fullName: studentUser.fullName },
    class: { name: 'No Class' }, // ክፍል ካለው ስሙን አስገባ
  };
  
  fs.writeFileSync('child.json', JSON.stringify(studentData, null, 2));

  console.log('✅ Child created & linked:', studentUser.email);
  console.log('✅ Child data saved to child.json');
}

main().catch((e) => console.error(e)).finally(() => prisma.$disconnect());