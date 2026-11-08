import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Payments E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let paymentId: string;
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
      .send({ name: `Pay Class ${Date.now()}`, gradeLevel: 5, academicYear: '2026' });
    classId = classRes.body.id;

    // Create a Student
    const studentRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `pay-student-${Date.now()}@iscms.local`,
        password: 'Student@1234',
        fullName: 'Pay Student',
        studentCode: `PAY-${Date.now()}`,
        dateOfBirth: '2010-05-15',
        gender: 'MALE',
        classId: classId,
      });
    studentId = studentRes.body.studentId;
  }, 30000);

  afterAll(async () => {
    if (paymentId) await prisma.payment.delete({ where: { id: paymentId } }).catch(() => {});
    if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student) await prisma.user.delete({ where: { id: student.userId } }).catch(() => {});
    }
    if (classId) await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /payments → 201 create payment', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        amount: 1500.00,
        dueDate: '2026-12-31',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('PENDING');
    paymentId = res.body.id;
  });

  it('GET /payments → 200 with list', async () => {
    const res = await request(app.getHttpServer())
      .get('/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /payments/:id/pay → 200 make payment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/payments/${paymentId}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ transactionId: `TX-${Date.now()}` })
      .expect(201);

    expect(res.body.status).toBe('PAID');
    expect(res.body).toHaveProperty('receiptNo');
  });

  it('DELETE /payments/:id → 200 delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/payments/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.message).toBe('Payment deleted successfully');
    paymentId = '';
  });
});