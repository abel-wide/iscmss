import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Notifications E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let notificationId: string;
  let announcementId: string;
  let parentId: string;

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

    // Create a Parent (for notification recipient)
    const parentRes = await prisma.user.create({
      data: {
        email: `parent-${Date.now()}@iscms.local`,
        passwordHash: 'dummyhash',
        fullName: 'Test Parent',
        role: 'PARENT',
        parent: { create: { relationship: 'Father' } },
      },
      include: { parent: true },
    });
    parentId = parentRes.parent!.id;
  }, 30000);

  afterAll(async () => {
    if (notificationId) await prisma.notification.delete({ where: { id: notificationId } }).catch(() => {});
    if (announcementId) await prisma.announcement.delete({ where: { id: announcementId } }).catch(() => {});
    if (parentId) {
      const parent = await prisma.parent.findUnique({ where: { id: parentId } });
      if (parent) await prisma.user.delete({ where: { id: parent.userId } }).catch(() => {});
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /notifications → 201 create notification', async () => {
    const res = await request(app.getHttpServer())
      .post('/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientId: parentId,
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'ANNOUNCEMENT',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    notificationId = res.body.id;
  });

  it('POST /notifications/announcements → 201 create announcement', async () => {
    const res = await request(app.getHttpServer())
      .post('/notifications/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Announcement',
        content: 'This is a test announcement',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    announcementId = res.body.id;
  });

  it('GET /notifications/announcements → 200 with list', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /notifications/:id/read → 200 mark as read', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.isRead).toBe(true);
  });
});