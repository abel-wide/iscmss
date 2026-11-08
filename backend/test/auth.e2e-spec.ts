import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import  request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('ISCMS E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let teacherId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // የአድሚን መረጃ መኖሩን አረጋግጥ
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@iscms.local' },
    });
    
    if (!admin) {
      await prisma.user.create({
        data: {
          email: 'admin@iscms.local',
          passwordHash: await bcrypt.hash('Admin@1234', 10),
          fullName: 'System Administrator',
          role: Role.ADMIN,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // 1. የ Login ፈተና
  it('POST /auth/login → 200 with JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@iscms.local', password: 'Admin@1234' })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body.user.role).toBe('ADMIN');
    adminToken = res.body.access_token;
  });

  // 2. የተሳሳተ የይለፍ ቃል ፈተና
    // 2. የተሳሳተ የይለፍ ቃል ፈተና
  it('POST /auth/login → 401 with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@iscms.local', password: 'wrongpass' })
      .expect(401);
  });

  // 3. ያለ Token የተጠበቀ ኤፒአይ ፈተና
  it('GET /users/teachers → 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/users/teachers')
      .expect(401);
  });

  // 4. አዲስ አስተማሪ መፍጠር
  it('POST /users/teachers → 201 create teacher', async () => {
    const email = `test-teacher-${Date.now()}@iscms.local`;
    const res = await request(app.getHttpServer())
      .post('/users/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        password: 'Teacher@1234',
        fullName: 'Test Teacher',
        qualification: 'MSc',
        subjectSpecialty: 'Physics',
      })
      .expect(201);

    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe('TEACHER');
    teacherId = res.body.id;
  });

  // 5. አስተማሪዎችን ማየት
  it('GET /users/teachers → 200 with list', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // 6. አስተማሪ ማስተካከል
  it('PATCH /users/teachers/:id → 200 update', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/teachers/${teacherId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Updated Teacher Name' })
      .expect(200);

    expect(res.body.message).toBe('Teacher updated successfully');
  });

  // 7. አስተማሪ ማጥፋት
  it('DELETE /users/teachers/:id → 200 delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/teachers/${teacherId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.message).toBe('Teacher deleted successfully');
  });
});