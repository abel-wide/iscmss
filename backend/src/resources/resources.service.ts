import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ ሪሶርስ መስቀል (Digital Library Upload)
  async createResource(dto: CreateResourceDto) {
    return this.prisma.resource.create({
      data: {
        title: dto.title,
        type: dto.type, // LESSON_NOTE, E_BOOK, VIDEO_LESSON
        url: dto.url,
        teacherId: dto.teacherId,
      },
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  // 2. ሁሉንም ሪሶርሶች ማየት (በአይነት ወይም በርዕስ ማጣሪያ ያለው)
  async findAllResources(type?: string, search?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    return this.prisma.resource.findMany({
      where,
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. በአስተማሪ ማጣራት
  async findResourcesByTeacher(teacherId: string) {
    return this.prisma.resource.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. ሪሶርስ ማጥፋት
  async removeResource(id: string) {
    const existing = await this.prisma.resource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Resource not found');
    await this.prisma.resource.delete({ where: { id } });
    return { message: 'Resource deleted successfully' };
  }
}
