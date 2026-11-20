import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(params: {
    q?: string;
    classId?: string;
    date?: string;
    subjectId?: string;
    paymentStatus?: PaymentStatus;
  }) {
    const { q, classId, date, subjectId, paymentStatus } = params;

    // 1. ተማሪዎችን መፈለግ (Students by Name, StudentCode)
    const studentWhere: any = {};
    if (classId) studentWhere.classId = classId;
    if (q) {
      studentWhere.OR = [
        { studentCode: { contains: q, mode: 'insensitive' } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        user: { select: { fullName: true, email: true } },
        class: { select: { name: true } },
      },
      take: 10,
    });

    // 2. ክፍሎችን መፈለግ (Classes by Name)
    const classes = await this.prisma.class.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
      take: 5,
    });

    // 3. የትምህርት አይነቶችን መፈለግ (Subjects by Name, Code)
    const subjects = await this.prisma.subject.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      take: 5,
    });

    // 4. ክፍያዎችን መፈለግ (Payments by Status)
    const paymentWhere: any = {};
    if (paymentStatus) paymentWhere.status = paymentStatus;
    if (q) {
      paymentWhere.student = {
        user: { fullName: { contains: q, mode: 'insensitive' } },
      };
    }
    const payments = await this.prisma.payment.findMany({
      where: paymentWhere,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
      },
      take: 10,
    });

    // 5. አቴንዳንስ በቀን መፈለግ (Attendance by Date)
    const attendanceWhere: any = {};
    if (date) attendanceWhere.date = new Date(date);
    if (classId) attendanceWhere.classId = classId;
    const attendances = date
      ? await this.prisma.attendance.findMany({
          where: attendanceWhere,
          include: {
            student: { include: { user: { select: { fullName: true } } } },
            class: { select: { name: true } },
          },
          take: 10,
        })
      : [];

    return {
      query: q || '',
      results: {
        students,
        classes,
        subjects,
        payments,
        attendances,
      },
    };
  }
}
