import { PrismaClient, Role, Gender } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding ISCMS database with all roles...\n');

  // ─── 1. ADMIN ────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin@1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iscms.local' },
    update: { passwordHash: adminPwd, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'admin@iscms.local',
      passwordHash: adminPwd,
      fullName: 'System Administrator',
      role: Role.ADMIN,
      isActive: true,
      loginAttempts: 0,
    },
  });
  console.log('✅ Admin:      admin@iscms.local     / Admin@1234     →', admin.id);

  // ─── 2. HEAD (Principal) ─────────────────────────────────────────
  const headPwd = await bcrypt.hash('Head@1234', 10);
  const head = await prisma.user.upsert({
    where: { email: 'head@iscms.local' },
    update: { passwordHash: headPwd, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'head@iscms.local',
      passwordHash: headPwd,
      fullName: 'Dr. Hailemariam Mengistu',
      role: Role.HEAD,
      isActive: true,
      loginAttempts: 0,
    },
  });
  console.log('✅ Head:       head@iscms.local      / Head@1234      →', head.id);

  // ─── 3. REGISTRAR ────────────────────────────────────────────────
  const registrarPwd = await bcrypt.hash('Registrar@1234', 10);
  const registrar = await prisma.user.upsert({
    where: { email: 'registrar@iscms.local' },
    update: { passwordHash: registrarPwd, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'registrar@iscms.local',
      passwordHash: registrarPwd,
      fullName: 'Aster Bekele',
      role: Role.REGISTRAR,
      isActive: true,
      loginAttempts: 0,
    },
  });
  console.log('✅ Registrar:  registrar@iscms.local / Registrar@1234 →', registrar.id);

  // ─── 4. TEACHER ──────────────────────────────────────────────────
  const teacherPwd = await bcrypt.hash('Teacher@1234', 10);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@iscms.local' },
    update: { passwordHash: teacherPwd, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'teacher@iscms.local',
      passwordHash: teacherPwd,
      fullName: 'Dawit Tadesse',
      role: Role.TEACHER,
      isActive: true,
      loginAttempts: 0,
    },
  });
  console.log('✅ Teacher:    teacher@iscms.local   / Teacher@1234   →', teacherUser.id);

  // Ensure a Teacher profile record exists
  const existingTeacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } });
  if (!existingTeacher) {
    const teacherRecord = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        qualification: 'B.Ed.',
        subjectSpecialty: 'Mathematics',
      },
    });
    console.log('   ↳ Teacher profile created:', teacherRecord.id);
  }

  // ─── 5. PARENT ───────────────────────────────────────────────────
  const parentPwd = await bcrypt.hash('Parent@1234', 10);
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@iscms.local' },
    update: { passwordHash: parentPwd, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'parent@iscms.local',
      passwordHash: parentPwd,
      fullName: 'Almaz Tefera',
      role: Role.PARENT,
      isActive: true,
      loginAttempts: 0,
    },
  });
  console.log('✅ Parent:     parent@iscms.local    / Parent@1234    →', parentUser.id);

  // Ensure a Parent profile record exists
  let parentRecord = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
  if (!parentRecord) {
    parentRecord = await prisma.parent.create({
      data: { userId: parentUser.id, relationship: 'Mother' },
    });
    console.log('   ↳ Parent profile created:', parentRecord.id);
  }

  // ─── 6. STUDENT ──────────────────────────────────────────────────
  const studentPwd = await bcrypt.hash('Student@1234', 10);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@iscms.local' },
    update: { passwordHash: studentPwd, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'student@iscms.local',
      passwordHash: studentPwd,
      fullName: 'Samuel Dawit',
      role: Role.STUDENT,
      isActive: true,
      loginAttempts: 0,
    },
  });
  console.log('✅ Student:    student@iscms.local   / Student@1234   →', studentUser.id);

  // Ensure a Student profile record exists
  const existingStudent = await prisma.student.findUnique({ where: { userId: studentUser.id } });
  if (!existingStudent) {
    const studentRecord = await prisma.student.create({
      data: {
        userId: studentUser.id,
        parentId: parentRecord.id,
        studentCode: 'STU-DEMO-001',
        dateOfBirth: new Date('2008-05-15'),
        gender: Gender.MALE,
      },
    });
    console.log('   ↳ Student profile created:', studentRecord.id);
  }

  console.log('\n🎉 All seed accounts are ready!\n');
  console.log('─────────────────────────────────────────────────────');
  console.log('  Role        Email                     Password');
  console.log('─────────────────────────────────────────────────────');
  console.log('  ADMIN       admin@iscms.local         Admin@1234');
  console.log('  HEAD        head@iscms.local          Head@1234');
  console.log('  REGISTRAR   registrar@iscms.local     Registrar@1234');
  console.log('  TEACHER     teacher@iscms.local       Teacher@1234');
  console.log('  PARENT      parent@iscms.local        Parent@1234');
  console.log('  STUDENT     student@iscms.local       Student@1234');
  console.log('─────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
