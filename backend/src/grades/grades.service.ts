import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarkDto } from './dto/create-mark.dto';
import { UpdateMarkDto } from './dto/update-mark.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  private getLetterGrade(total: number): { letter: string; remark: string } {
    if (total >= 90) return { letter: 'A', remark: 'Excellent' };
    if (total >= 80) return { letter: 'B', remark: 'Very Good' };
    if (total >= 70) return { letter: 'C', remark: 'Satisfactory' };
    if (total >= 60) return { letter: 'D', remark: 'Pass' };
    return { letter: 'F', remark: 'Fail / Needs Improvement' };
  }

  private async notifyParentOnGrade(studentId: string, subjectName: string, total: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, parent: true },
    });
    if (student?.parentId) {
      await this.prisma.notification.create({
        data: {
          recipientId: student.parentId,
          title: `Grade Update: ${student.user.fullName}`,
          message: `New score posted for ${student.user.fullName} in ${subjectName}: ${total}/100.`,
          type: 'GRADE_UPDATE',
        },
      });
    }
  }

  // 1. አዲስ ውጤት መመዝገብ ወይም ማዘመን (Add or Update Mark)
  async createMark(dto: CreateMarkDto, currentUserId?: string) {
    let teacherId = dto.teacherId;
    if (!teacherId && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
      });
      if (teacher) {
        teacherId = teacher.id;
      }
    }
    if (!teacherId) {
      const firstTeacher = await this.prisma.teacher.findFirst();
      if (firstTeacher) {
        teacherId = firstTeacher.id;
      } else {
        throw new NotFoundException('No teacher record found to associate with mark.');
      }
    }

    const total = dto.assessment + dto.finalExam;

    const existing = await this.prisma.mark.findUnique({
      where: {
        studentId_subjectId: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
        },
      },
    });

    if (existing) {
      const updated = await this.prisma.mark.update({
        where: { id: existing.id },
        data: {
          assessment: dto.assessment,
          finalExam: dto.finalExam,
          total,
          teacherId,
        },
        include: {
          student: { include: { user: { select: { fullName: true } } } },
          subject: { select: { name: true, code: true } },
          teacher: { include: { user: { select: { fullName: true } } } },
        },
      });

      if (updated.subject?.name) {
        await this.notifyParentOnGrade(dto.studentId, updated.subject.name, total);
      }
      return updated;
    }

    const mark = await this.prisma.mark.create({
      data: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        teacherId,
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

    // ወላጅን ወዲያውኑ ማሳወቅ
    if (mark.subject?.name) {
      await this.notifyParentOnGrade(dto.studentId, mark.subject.name, total);
    }

    return mark;
  }

  // 2. ሁሉንም ውጤቶች ማየት
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

  // 4. የተማሪ ሪፖርት ካርድ ማዘጋጀት (Report Card Generation with GPA & Rank)
  async generateReportCard(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true, email: true } },
        class: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const marks = await this.prisma.mark.findMany({
      where: { studentId },
      include: {
        subject: true,
        teacher: { include: { user: { select: { fullName: true } } } },
      },
    });

    const evaluatedMarks = marks.map((m) => {
      const { letter, remark } = this.getLetterGrade(m.total);
      return {
        subject: m.subject.name,
        code: m.subject.code,
        teacher: m.teacher?.user?.fullName || 'N/A',
        assessment: m.assessment,
        finalExam: m.finalExam,
        total: m.total,
        grade: letter,
        remark,
      };
    });

    const totalScore = marks.reduce((acc, m) => acc + m.total, 0);
    const averageScore = marks.length > 0 ? Number((totalScore / marks.length).toFixed(2)) : 0;
    const gpa = Number(((averageScore / 100) * 4.0).toFixed(2));

    // የክፍል ደረጃ (Class Rank Calculation)
    let rank: number | null = null;
    let totalStudentsInClass = 0;
    if (student.classId) {
      const classmates = await this.prisma.student.findMany({
        where: { classId: student.classId },
        include: { marks: true },
      });
      totalStudentsInClass = classmates.length;

      const ranked = classmates
        .map((c) => {
          const avg = c.marks.length > 0 ? c.marks.reduce((a, m) => a + m.total, 0) / c.marks.length : 0;
          return { id: c.id, avg };
        })
        .sort((a, b) => b.avg - a.avg);

      const foundIndex = ranked.findIndex((c) => c.id === studentId);
      if (foundIndex !== -1) rank = foundIndex + 1;
    }

    return {
      student: {
        id: student.id,
        fullName: student.user.fullName,
        studentCode: student.studentCode,
        gender: student.gender,
        class: student.class?.name || 'Unassigned',
      },
      academicPerformance: {
        totalSubjects: marks.length,
        averageScore,
        gpa,
        rank,
        totalStudentsInClass,
      },
      subjects: evaluatedMarks,
      issuedAt: new Date(),
    };
  }

  // 5. ውጤት ማስተካከል
  async updateMark(id: string, dto: UpdateMarkDto) {
    const existing = await this.prisma.mark.findUnique({
      where: { id },
      include: { subject: true },
    });
    if (!existing) throw new NotFoundException('Mark not found');

    const total = (dto.assessment ?? existing.assessment) + (dto.finalExam ?? existing.finalExam);

    const updated = await this.prisma.mark.update({
      where: { id },
      data: {
        assessment: dto.assessment,
        finalExam: dto.finalExam,
        total: total,
      },
    });

    if (existing.subject?.name) {
      await this.notifyParentOnGrade(existing.studentId, existing.subject.name, total);
    }

    return updated;
  }

  // 6. ውጤት ማጥፋት
  async removeMark(id: string) {
    const existing = await this.prisma.mark.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Mark not found');

    await this.prisma.mark.delete({ where: { id } });
    return { message: 'Mark deleted successfully' };
  }
}
