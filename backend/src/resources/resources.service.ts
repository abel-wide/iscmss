import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ ሪሶርስ መስቀል
  async createResource(dto: CreateResourceDto) {
    return this.prisma.resource.create({
      data: {
        title: dto.title,
        type: dto.type,
        url: dto.url,
        teacherId: dto.teacherId,
      },
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  // 2. ሁሉንም ሪሶርሶች ማየት
  async findAllResources() {
    return this.prisma.resource.findMany({
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