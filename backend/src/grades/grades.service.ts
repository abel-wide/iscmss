import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarkDto } from './dto/create-mark.dto';
import { UpdateMarkDto } from './dto/update-mark.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ ውጤት መመዝገብ
  async createMark(dto: CreateMarkDto) {
    const existing = await this.prisma.mark.findUnique({
      where: {
        studentId_subjectId: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Mark already exists for this student and subject');
    }

    const total = dto.assessment + dto.finalExam;

    return this.prisma.mark.create({
      data: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        assessment: dto.assessment,
        finalExam: dto.finalExam,
        total: total,
      },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        subject: { select: { name: true, code: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  // 2. ሁሉንም ውጤቶች ማየት (በተማሪ ወይም በትምህርት አይነት ማጣራት ይቻላል)
  async findAllMarks(studentId?: string, subjectId?: string) {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;

    return this.prisma.mark.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        subject: { select: { name: true, code: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. የአንድ ተማሪ ውጤት በዝርዝር ማየት
  async findStudentMarks(studentId: string) {
    return this.prisma.mark.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  // 4. ውጤት ማስተካከል
  async updateMark(id: string, dto: UpdateMarkDto) {
    const existing = await this.prisma.mark.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Mark not found');

    const total = (dto.assessment ?? existing.assessment) + (dto.finalExam ?? existing.finalExam);

    return this.prisma.mark.update({
      where: { id },
      data: {
        assessment: dto.assessment,
        finalExam: dto.finalExam,
        total: total,
      },
    });
  }

  // 5. ውጤት ማጥፋት
  async removeMark(id: string) {
    const existing = await this.prisma.mark.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Mark not found');

    await this.prisma.mark.delete({ where: { id } });
    return { message: 'Mark deleted successfully' };
  }
}