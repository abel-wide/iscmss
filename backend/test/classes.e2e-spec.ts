import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Classes E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let classId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@iscms.local', password: 'Admin@1234' });
    adminToken = loginRes.body.access_token;
  }, 30000);

  afterAll(async () => {
    if (classId) {
      await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /classes → 201 create class', async () => {
    const res = await request(app.getHttpServer())
      .post('/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Class ${Date.now()}`,
        gradeLevel: 5,
        academicYear: '2026',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    classId = res.body.id;
  });

  it('GET /classes → 200 with list', async () => {
    const res = await request(app.getHttpServer())
      .get('/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /classes/:id → 200 update', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/classes/${classId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Class Name' })
      .expect(200);

    expect(res.body.name).toBe('Updated Class Name');
  });

  it('DELETE /classes/:id → 200 delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/classes/${classId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.message).toBe('Class deleted successfully');
    classId = '';
  });
});