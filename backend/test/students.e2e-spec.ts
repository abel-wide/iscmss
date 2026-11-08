import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Students E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentId: string; // ይህ የተማሪው መለያ (Student ID) ይሆናል
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
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@iscms.local', password: 'Admin@1234' });
    adminToken = loginRes.body.access_token;

    // Create a Class for testing
    const classRes = await request(app.getHttpServer())
      .post('/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Test Class ${Date.now()}`, gradeLevel: 5, academicYear: '2026' });
    classId = classRes.body.id;
  }, 30000);

  afterAll(async () => {
    // የተፈጠሩትን መረጃዎች ማጽዳት
    if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student) {
        await prisma.user.delete({ where: { id: student.userId } }).catch(() => {});
      }
    }
    if (classId) await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /students → 201 create student', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `student-${Date.now()}@iscms.local`,
        password: 'Student@1234',
        fullName: 'Test Student',
        studentCode: `STU-${Date.now()}`,
        dateOfBirth: '2010-05-15',
        gender: 'MALE',
        classId: classId,
      })
      .expect(201);

    expect(res.body).toHaveProperty('studentId');
    expect(res.body.role).toBe('STUDENT');
    
    // ትክክለኛውን Student ID እንያዝ (ለ PATCH & DELETE)
    studentId = res.body.studentId; 
  });

  it('GET /students → 200 with list', async () => {
    const res = await request(app.getHttpServer())
      .get('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /students/:id → 200 update', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/students/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Updated Student Name' })
      .expect(200);

    expect(res.body.message).toBe('Student updated successfully');
  });

  it('DELETE /students/:id → 200 delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/students/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.message).toBe('Student deleted successfully');
    studentId = ''; // ከዚህ በኋላ ለ afterAll አያስፈልግም
  });
});