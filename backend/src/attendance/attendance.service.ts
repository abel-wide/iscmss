import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // 1. አንድ አቴንዳንስ መመዝገብ
  async markAttendance(dto: CreateAttendanceDto, markedById: string) {
    const existing = await this.prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: dto.studentId,
          date: new Date(dto.date),
        },
      },
    });

    if (existing) {
      throw new ConflictException('Attendance already marked for this student on this date');
    }

    return this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        classId: dto.classId,
        date: new Date(dto.date),
        status: dto.status,
        method: dto.method || 'TEACHER',
        markedBy: markedById,
      },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        class: { select: { name: true } }, // <-- አሁን መስራት አለበት
      },
    });
  }

  // 2. በ Bulk (ለአንድ ክፍል በአንድ ጊዜ) አቴንዳንስ መመዝገብ
  async markBulkAttendance(dto: BulkAttendanceDto, markedById: string) {
    const results = [];
    for (const item of dto.attendances) {
      try {
        const existing = await this.prisma.attendance.findUnique({
          where: { studentId_date: { studentId: item.studentId, date: new Date(item.date) } },
        });

        if (!existing) {
          const result = await this.prisma.attendance.create({
            data: {
              studentId: item.studentId,
              classId: item.classId,
              date: new Date(item.date),
              status: item.status,
              method: item.method || 'TEACHER',
              markedBy: markedById,
            },
          });
          results.push(result);
        }
      } catch (error) {
        // ስህተት ካለ ዝለል
      }
    }
    return { message: `Successfully marked ${results.length} attendances`, count: results.length };
  }

  // 3. ሁሉንም አቴንዳንስዎች ማየት
  async findAllAttendances(classId?: string, date?: string) {
    const where: any = {};
    if (classId) where.classId = classId;
    if (date) where.date = new Date(date);

    return this.prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // 4. የአንድ ተማሪ አቴንዳንስ ታሪክ ማየት
  async findStudentAttendance(studentId: string) {
    return this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        class: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // 5. አቴንዳንስ ማስተካከል
  async updateAttendance(id: string, dto: UpdateAttendanceDto) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');

    return this.prisma.attendance.update({
      where: { id },
      data: {
        status: dto.status,
        method: dto.method,
      },
    });
  }

  // 6. አቴንዳንስ ማጥፋት
  async removeAttendance(id: string) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');

    await this.prisma.attendance.delete({ where: { id } });
    return { message: 'Attendance deleted successfully' };
  }
}