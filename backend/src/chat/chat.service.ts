// backend/src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(senderId: string, receiverId: string, content: string) {
    return this.prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { fullName: true, role: true } },
      },
    });
  }

  async getContacts(currentUserId?: string) {
    return this.prisma.user.findMany({
      where: {
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        email: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async getConversation(user1Id: string, user2Id: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { fullName: true, role: true } },
      },
    });
  }
}