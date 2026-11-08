import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ ክፍል መፍጠር
  async createClass(dto: CreateClassDto) {
    const existing = await this.prisma.class.findFirst({
      where: { name: dto.name, academicYear: dto.academicYear },
    });
    if (existing) {
      throw new ConflictException('Class with this name already exists in this academic year');
    }

    // Room Teacher ከተሰጠ አስተማሪው መኖሩን አረጋግጥ
    if (dto.roomTeacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: dto.roomTeacherId },
      });
      if (!teacher) {
        throw new NotFoundException('Assigned Room Teacher not found');
      }
    }

    return this.prisma.class.create({
      data: {
        name: dto.name,
        gradeLevel: dto.gradeLevel,
        academicYear: dto.academicYear,
        roomTeacherId: dto.roomTeacherId,
      },
      include: {
        roomTeacher: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
    });
  }

  // 2. ሁሉንም ክፍሎች ማየት
  async findAllClasses() {
    return this.prisma.class.findMany({
      include: {
        roomTeacher: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        _count: {
          select: { students: true }, // በክፍሉ ውስጥ ያሉ ተማሪዎች ብዛት
        },
      },
      orderBy: { gradeLevel: 'asc' },
    });
  }

  // 3. አንድ ክፍል በ ID ማየት
  async findOneClass(id: string) {
    const classData = await this.prisma.class.findUnique({
      where: { id },
      include: {
        roomTeacher: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        students: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        timetables: {
          include: { subject: true },
        },
      },
    });
    if (!classData) throw new NotFoundException('Class not found');
    return classData;
  }

  // 4. ክፍል ማስተካከል
  async updateClass(id: string, dto: UpdateClassDto) {
    const existing = await this.prisma.class.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Class not found');

    return this.prisma.class.update({
      where: { id },
      data: dto,
    });
  }

  // 5. ክፍል ማጥፋት
  async removeClass(id: string) {
    const existing = await this.prisma.class.findUnique({ 
      where: { id },
      include: { students: true }
    });
    if (!existing) throw new NotFoundException('Class not found');

    // በክፍሉ ውስጥ ተማሪዎች ካሉ ማጥፋት አይፈቀድም
    if (existing.students.length > 0) {
      throw new ConflictException('Cannot delete class with students. Reassign students first.');
    }

    await this.prisma.class.delete({ where: { id } });
    return { message: 'Class deleted successfully' };
  }
}