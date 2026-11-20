import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // ክፍልን የሚያስተምረው ሩም ቲቸር (Room Teacher) መሆኑን ማረጋገጥ
  private async verifyRoomTeacherOrAdmin(userId: string, classId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') return; // Admin has override authority

    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!targetClass) throw new NotFoundException('Class not found');

    if (!user.teacher || targetClass.roomTeacherId !== user.teacher.id) {
      throw new ForbiddenException(
        'Policy enforcement: Only the assigned Room Teacher for this class (or Admin) can mark attendance.',
      );
    }
  }

  // ተማሪ ከቀረ ለወላጅ አፋጣኝ ማሳወቂያ መላክ
  private async notifyParentIfAbsent(studentId: string, status: AttendanceStatus, date: Date) {
    if (status === AttendanceStatus.ABSENT || status === AttendanceStatus.LATE) {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true, parent: true },
      });
      if (student?.parentId) {
        const formattedDate = date.toISOString().split('T')[0];
        await this.prisma.notification.create({
          data: {
            recipientId: student.parentId,
            title: `Attendance Alert: ${student.user.fullName}`,
            message: `Your child ${student.user.fullName} was marked ${status} on ${formattedDate}.`,
            type: 'ABSENCE_ALERT',
          },
        });
      }
    }
  }

  // 1. አንድ አቴንዳንስ መመዝገብ (የክፍሉ ሩም ቲቸር ብቻ)
  async markAttendance(dto: CreateAttendanceDto, markedById: string) {
    await this.verifyRoomTeacherOrAdmin(markedById, dto.classId);

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

    const attendanceDate = new Date(dto.date);

    const attendance = await this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        classId: dto.classId,
        date: attendanceDate,
        status: dto.status,
        method: 'ROOM_TEACHER',
        markedBy: markedById,
      },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        class: { select: { name: true } },
      },
    });

    // ተማሪው ካልመጣ ለወላጅ ወዲያውኑ ማሳወቂያ መላክ
    await this.notifyParentIfAbsent(dto.studentId, dto.status, attendanceDate);

    return attendance;
  }

  // 2. በ Bulk (ለአንድ ሙሉ ክፍል በአንድ ጊዜ) አቴንዳንስ መመዝገብ
  async markBulkAttendance(dto: BulkAttendanceDto, markedById: string) {
    if (dto.attendances.length === 0) {
      return { message: 'No attendance records provided', count: 0 };
    }

    // የክፍሉን ሩም ቲቸር ማረጋገጥ
    const sampleClassId = dto.attendances[0].classId;
    await this.verifyRoomTeacherOrAdmin(markedById, sampleClassId);

    const results = [];
    for (const item of dto.attendances) {
      try {
        const attendanceDate = new Date(item.date);
        const existing = await this.prisma.attendance.findUnique({
          where: { studentId_date: { studentId: item.studentId, date: attendanceDate } },
        });

        if (!existing) {
          const result = await this.prisma.attendance.create({
            data: {
              studentId: item.studentId,
              classId: item.classId,
              date: attendanceDate,
              status: item.status,
              method: 'ROOM_TEACHER',
              markedBy: markedById,
            },
          });
          results.push(result);

          // ወላጅ ማሳወቅ
          await this.notifyParentIfAbsent(item.studentId, item.status, attendanceDate);
        }
      } catch (error) {
        // Skip duplicate or errors
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

  // 5. የአቴንዳንስ ሪፖርት (Attendance Report & Analytics)
  async getAttendanceReport(classId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (classId) where.classId = classId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const total = attendances.length;
    const present = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const absent = attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    const late = attendances.filter((a) => a.status === AttendanceStatus.LATE).length;
    const excused = attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;

    return {
      summary: {
        totalRecords: total,
        present,
        absent,
        late,
        excused,
        attendanceRate: `${rate.toFixed(1)}%`,
      },
      records: attendances,
    };
  }

  // 6. አቴንዳንስ ማስተካከል
  async updateAttendance(id: string, dto: UpdateAttendanceDto, userId: string) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');

    await this.verifyRoomTeacherOrAdmin(userId, existing.classId);

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        status: dto.status,
        method: 'ROOM_TEACHER',
      },
    });

    if (dto.status) {
      await this.notifyParentIfAbsent(existing.studentId, dto.status, existing.date);
    }

    return updated;
  }

  // 7. አቴንዳንስ ማጥፋት
  async removeAttendance(id: string) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');

    await this.prisma.attendance.delete({ where: { id } });
    return { message: 'Attendance deleted successfully' };
  }
}
