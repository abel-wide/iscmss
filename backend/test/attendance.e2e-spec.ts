import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttendanceStatus } from '@prisma/client';

describe('Attendance E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let teacherToken: string;
  let attendanceId: string;
  let studentId: string;
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
      .send({ name: `Attendance Class ${Date.now()}`, gradeLevel: 5, academicYear: '2026' });
    classId = classRes.body.id;

    // Create a Student
    const studentRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `att-student-${Date.now()}@iscms.local`,
        password: 'Student@1234',
        fullName: 'Attendance Student',
        studentCode: `ATT-${Date.now()}`,
        dateOfBirth: '2010-05-15',
        gender: 'MALE',
        classId: classId,
      });
    studentId = studentRes.body.studentId;
  }, 30000);

  afterAll(async () => {
    if (attendanceId) await prisma.attendance.delete({ where: { id: attendanceId } }).catch(() => {});
    if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student) await prisma.user.delete({ where: { id: student.userId } }).catch(() => {});
    }
    if (classId) await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /attendance → 201 mark attendance', async () => {
    const res = await request(app.getHttpServer())
      .post('/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        classId,
        date: new Date().toISOString(),
        status: AttendanceStatus.PRESENT,
        method: 'TEACHER',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('PRESENT');
    attendanceId = res.body.id;
  });

  it('GET /attendance → 200 with list', async () => {
    const res = await request(app.getHttpServer())
      .get(`/attendance?classId=${classId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /attendance/:id → 200 update', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/attendance/${attendanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: AttendanceStatus.ABSENT })
      .expect(200);

    expect(res.body.status).toBe('ABSENT');
  });

  it('DELETE /attendance/:id → 200 delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/attendance/${attendanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.message).toBe('Attendance deleted successfully');
    attendanceId = '';
  });
});