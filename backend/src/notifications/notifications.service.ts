import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ ማሳወቂያ መላክ
  async createNotification(dto: CreateNotificationDto) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: dto.recipientId },
    });
    if (!parent) throw new NotFoundException('Parent not found');

    return this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
      },
    });
  }

  // 2. የአንድ ወላጅ ማሳወቂያዎችን ማየት
  async getParentNotifications(parentId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: parentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. ማሳወቂያ እንደተነበበ ምልክት ማድረግ
  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // 4. አዲስ ማስታወቂያ (Announcement) መፍጠር
  async createAnnouncement(dto: CreateAnnouncementDto, authorId: string) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  // 5. ሁሉንም ማስታወቂያዎች ማየት
  async getAllAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}