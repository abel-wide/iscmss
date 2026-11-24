import { PrismaClient, Role, Gender, AttendanceStatus, PaymentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting full ISCMS school data seeding...\n');

  // ─── 1. CORE USERS ────────────────────────────────────────────────
  const defaultHash = await bcrypt.hash('Admin@1234', 10);
  const headHash = await bcrypt.hash('Head@1234', 10);
  const regHash = await bcrypt.hash('Registrar@1234', 10);
  const teacherHash = await bcrypt.hash('Teacher@1234', 10);
  const parentHash = await bcrypt.hash('Parent@1234', 10);
  const studentHash = await bcrypt.hash('Student@1234', 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iscms.local' },
    update: { passwordHash: defaultHash, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'admin@iscms.local',
      passwordHash: defaultHash,
      fullName: 'System Administrator',
      role: Role.ADMIN,
    },
  });

  // Head
  const head = await prisma.user.upsert({
    where: { email: 'head@iscms.local' },
    update: { passwordHash: headHash, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'head@iscms.local',
      passwordHash: headHash,
      fullName: 'Dr. Hailemariam Mengistu',
      role: Role.HEAD,
    },
  });

  // Registrar
  const registrar = await prisma.user.upsert({
    where: { email: 'registrar@iscms.local' },
    update: { passwordHash: regHash, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'registrar@iscms.local',
      passwordHash: regHash,
      fullName: 'Aster Bekele',
      role: Role.REGISTRAR,
    },
  });

  // Teacher Dawit
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@iscms.local' },
    update: { passwordHash: teacherHash, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'teacher@iscms.local',
      passwordHash: teacherHash,
      fullName: 'Dawit Tadesse',
      role: Role.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: { qualification: 'M.Sc. Mathematics Education', subjectSpecialty: 'Mathematics' },
    create: {
      userId: teacherUser.id,
      qualification: 'M.Sc. Mathematics Education',
      subjectSpecialty: 'Mathematics',
    },
  });

  // Parent Almaz
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@iscms.local' },
    update: { passwordHash: parentHash, isActive: true, loginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'parent@iscms.local',
      passwordHash: parentHash,
      fullName: 'Almaz Tefera',
      role: Role.PARENT,
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: { relationship: 'Mother' },
    create: {
      userId: parentUser.id,
      relationship: 'Mother',
    },
  });

  console.log('✅ Core users & profiles seeded.');

  // ─── 2. SUBJECTS ──────────────────────────────────────────────────
  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH101' },
    { name: 'English Language', code: 'ENG101' },
    { name: 'Physics', code: 'PHYS101' },
    { name: 'Chemistry', code: 'CHEM101' },
    { name: 'Biology', code: 'BIO101' },
    { name: 'History', code: 'HIST101' },
    { name: 'Civics & Ethics', code: 'CIV101' },
  ];

  const subjects: Record<string, string> = {};
  for (const s of subjectDefs) {
    const sub = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { name: s.name, code: s.code },
    });
    subjects[s.code] = sub.id;
  }
  console.log('✅ Subjects seeded (7 subjects).');

  // ─── 3. CLASSES ───────────────────────────────────────────────────
  const classDefs = [
    { name: 'Grade 10-A', gradeLevel: 10, academicYear: '2026/27', roomTeacherId: teacher.id },
    { name: 'Grade 10-B', gradeLevel: 10, academicYear: '2026/27' },
    { name: 'Grade 9-A', gradeLevel: 9, academicYear: '2026/27' },
    { name: 'Grade 9-B', gradeLevel: 9, academicYear: '2026/27' },
  ];

  const classes: Record<string, string> = {};
  for (const c of classDefs) {
    let existing = await prisma.class.findFirst({
      where: { name: c.name, academicYear: c.academicYear },
    });
    if (!existing) {
      existing = await prisma.class.create({
        data: {
          name: c.name,
          gradeLevel: c.gradeLevel,
          academicYear: c.academicYear,
          roomTeacherId: c.roomTeacherId || null,
        },
      });
    }
    classes[c.name] = existing.id;
  }
  console.log('✅ Classes seeded (Grade 10-A, 10-B, 9-A, 9-B).');

  // ─── 4. STUDENTS ──────────────────────────────────────────────────
  const studentData = [
    {
      email: 'student@iscms.local',
      fullName: 'Samuel Dawit',
      studentCode: 'STU-1001',
      gender: Gender.MALE,
      dob: new Date('2009-03-12'),
      classId: classes['Grade 10-A'],
      parentId: parent.id,
    },
    {
      email: 'ruth.student@iscms.local',
      fullName: 'Ruth Dawit',
      studentCode: 'STU-1002',
      gender: Gender.FEMALE,
      dob: new Date('2010-07-21'),
      classId: classes['Grade 10-A'],
      parentId: parent.id,
    },
    {
      email: 'abel.haile@iscms.local',
      fullName: 'Abel Haile',
      studentCode: 'STU-1003',
      gender: Gender.MALE,
      dob: new Date('2009-08-14'),
      classId: classes['Grade 10-A'],
    },
    {
      email: 'bethlehem.g@iscms.local',
      fullName: 'Bethlehem Girma',
      studentCode: 'STU-1004',
      gender: Gender.FEMALE,
      dob: new Date('2009-11-05'),
      classId: classes['Grade 10-A'],
    },
    {
      email: 'yonas.b@iscms.local',
      fullName: 'Yonas Bekele',
      studentCode: 'STU-1005',
      gender: Gender.MALE,
      dob: new Date('2009-01-29'),
      classId: classes['Grade 10-B'],
    },
    {
      email: 'kalkidan.t@iscms.local',
      fullName: 'Kalkidan Tadesse',
      studentCode: 'STU-1006',
      gender: Gender.FEMALE,
      dob: new Date('2010-04-18'),
      classId: classes['Grade 9-A'],
    },
  ];

  const studentRecords: Record<string, string> = {};

  for (const s of studentData) {
    const sUser = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash: studentHash, isActive: true, loginAttempts: 0, lockoutUntil: null },
      create: {
        email: s.email,
        passwordHash: studentHash,
        fullName: s.fullName,
        role: Role.STUDENT,
      },
    });

    const studentRec = await prisma.student.upsert({
      where: { userId: sUser.id },
      update: {
        classId: s.classId,
        parentId: s.parentId || null,
        studentCode: s.studentCode,
      },
      create: {
        userId: sUser.id,
        studentCode: s.studentCode,
        dateOfBirth: s.dob,
        gender: s.gender,
        classId: s.classId,
        parentId: s.parentId || null,
      },
    });

    studentRecords[s.studentCode] = studentRec.id;
  }
  console.log('✅ Students seeded (Samuel Dawit, Ruth Dawit, and 4 classmates).');

  // ─── 5. PARENT PAYMENTS ───────────────────────────────────────────
  const samuelId = studentRecords['STU-1001'];
  const ruthId = studentRecords['STU-1002'];

  if (samuelId) {
    // Paid Term 1
    const existingP1 = await prisma.payment.findFirst({
      where: { studentId: samuelId, receiptNo: 'RCP-2026-1001' },
    });
    if (!existingP1) {
      await prisma.payment.create({
        data: {
          studentId: samuelId,
          amount: 2500.0,
          status: PaymentStatus.PAID,
          dueDate: new Date('2026-09-30'),
          paidAt: new Date('2026-09-25'),
          receiptNo: 'RCP-2026-1001',
          transactionId: 'CBE-TX-987123',
        },
      });
    }

    // Pending Term 2
    const existingP2 = await prisma.payment.findFirst({
      where: { studentId: samuelId, status: PaymentStatus.PENDING },
    });
    if (!existingP2) {
      await prisma.payment.create({
        data: {
          studentId: samuelId,
          amount: 2500.0,
          status: PaymentStatus.PENDING,
          dueDate: new Date('2026-12-15'),
        },
      });
    }
  }

  if (ruthId) {
    // Paid Term 1
    const existingP3 = await prisma.payment.findFirst({
      where: { studentId: ruthId, receiptNo: 'RCP-2026-1002' },
    });
    if (!existingP3) {
      await prisma.payment.create({
        data: {
          studentId: ruthId,
          amount: 2500.0,
          status: PaymentStatus.PAID,
          dueDate: new Date('2026-09-30'),
          paidAt: new Date('2026-09-28'),
          receiptNo: 'RCP-2026-1002',
          transactionId: 'TELEBIRR-882190',
        },
      });
    }

    // Overdue Term 2
    const existingP4 = await prisma.payment.findFirst({
      where: { studentId: ruthId, status: PaymentStatus.OVERDUE },
    });
    if (!existingP4) {
      await prisma.payment.create({
        data: {
          studentId: ruthId,
          amount: 2500.0,
          status: PaymentStatus.OVERDUE,
          dueDate: new Date('2026-11-10'),
        },
      });
    }
  }
  console.log('✅ Parent payments seeded (Paid, Pending, Overdue in Birr).');

  // ─── 6. MARKS / GRADES ────────────────────────────────────────────
  if (samuelId) {
    const marksData = [
      { code: 'MATH101', assessment: 36, finalExam: 56 }, // 92 - A
      { code: 'PHYS101', assessment: 34, finalExam: 51 }, // 85 - B
      { code: 'ENG101', assessment: 38, finalExam: 55 },  // 93 - A
      { code: 'CHEM101', assessment: 30, finalExam: 48 }, // 78 - C
      { code: 'BIO101', assessment: 35, finalExam: 52 },  // 87 - B
    ];

    for (const m of marksData) {
      const subId = subjects[m.code];
      if (subId) {
        await prisma.mark.upsert({
          where: {
            studentId_subjectId: {
              studentId: samuelId,
              subjectId: subId,
            },
          },
          update: {
            assessment: m.assessment,
            finalExam: m.finalExam,
            total: m.assessment + m.finalExam,
            teacherId: teacher.id,
          },
          create: {
            studentId: samuelId,
            subjectId: subId,
            teacherId: teacher.id,
            assessment: m.assessment,
            finalExam: m.finalExam,
            total: m.assessment + m.finalExam,
          },
        });
      }
    }
  }

  // ─── 7. ATTENDANCE ────────────────────────────────────────────────
  if (samuelId && classes['Grade 10-A']) {
    const days = [
      '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14',
      '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21',
      '2026-11-24',
    ];

    for (let i = 0; i < days.length; i++) {
      const d = new Date(days[i]);
      const status = i === 4 ? AttendanceStatus.ABSENT : i === 7 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: samuelId,
            date: d,
          },
        },
        update: { status },
        create: {
          studentId: samuelId,
          classId: classes['Grade 10-A'],
          date: d,
          status,
          method: 'TEACHER',
          markedBy: teacherUser.id,
        },
      });
    }
  }
  console.log('✅ Marks & Attendance records seeded.');

  console.log('\n🎉 ALL DATA HAS BEEN SUCCESSFULLY SEEDED TO NEON POSTGRESQL!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
