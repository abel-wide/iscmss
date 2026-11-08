import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Grades E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let markId: string;
  let studentId: string;
  let subjectId: string;
  let teacherId: string;
  let classId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Login as Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@iscms.local', password: 'Admin@1234' });
    adminToken = adminLogin.body.access_token;

    // Create a Class
    const classRes = await request(app.getHttpServer())
      .post('/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Grade Class ${Date.now()}`, gradeLevel: 5, academicYear: '2026' });
    classId = classRes.body.id;

    // Create a Student
    const studentRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `grade-student-${Date.now()}@iscms.local`,
        password: 'Student@1234',
        fullName: 'Grade Student',
        studentCode: `GRD-${Date.now()}`,
        dateOfBirth: '2010-05-15',
        gender: 'MALE',
        classId: classId,
      });
    studentId = studentRes.body.studentId;

    // Create a Teacher
    const teacherRes = await request(app.getHttpServer())
      .post('/users/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `grade-teacher-${Date.now()}@iscms.local`,
        password: 'Teacher@1234',
        fullName: 'Grade Teacher',
      });
    teacherId = teacherRes.body.teacherId;

    // Create a Subject
    const subjectRes = await prisma.subject.create({
      data: { name: 'Mathematics', code: `MATH-${Date.now()}` },
    });
    subjectId = subjectRes.id;
  }, 30000);

  afterAll(async () => {
    if (markId) await prisma.mark.delete({ where: { id: markId } }).catch(() => {});
    if (subjectId) await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student) await prisma.user.delete({ where: { id: student.userId } }).catch(() => {});
    }
    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (teacher) await prisma.user.delete({ where: { id: teacher.userId } }).catch(() => {});
    }
    if (classId) await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /grades → 201 create mark', async () => {
    const res = await request(app.getHttpServer())
      .post('/grades')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        subjectId,
        teacherId,
        assessment: 35,
        finalExam: 50,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.total).toBe(85);
    markId = res.body.id;
  });

  it('GET /grades → 200 with list', async () => {
    const res = await request(app.getHttpServer())
      .get('/grades')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /grades/:id → 200 update', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/grades/${markId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assessment: 40, finalExam: 55 })
      .expect(200);

    expect(res.body.total).toBe(95);
  });

  it('DELETE /grades/:id → 200 delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/grades/${markId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.message).toBe('Mark deleted successfully');
    markId = '';
  });
});