import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // 1. የተማሪዎች አቴንዳንስ ሪፖርት (Student Attendance Report)
  async getAttendanceReport(classId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (classId) where.classId = classId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        class: { select: { name: true } },
      },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
    const excused = records.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
    const overallRate = total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 0;

    return {
      reportType: 'STUDENT_ATTENDANCE_REPORT',
      generatedAt: new Date(),
      metrics: {
        totalRecords: total,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        excusedCount: excused,
        overallAttendanceRate: `${overallRate}%`,
      },
      records,
    };
  }

  // 2. የትምህርት ውጤት አፈጻጸም ሪፖርት (Academic Performance Report)
  async getAcademicReport(classId?: string) {
    const marks = await this.prisma.mark.findMany({
      where: classId ? { student: { classId } } : undefined,
      include: {
        student: { include: { user: { select: { fullName: true } }, class: true } },
        subject: { select: { name: true, code: true } },
      },
    });

    const totalEntries = marks.length;
    const averageScore = totalEntries > 0 ? Number((marks.reduce((a, m) => a + m.total, 0) / totalEntries).toFixed(2)) : 0;
    const passed = marks.filter((m) => m.total >= 60).length;
    const failed = marks.filter((m) => m.total < 60).length;
    const passRate = totalEntries > 0 ? Number(((passed / totalEntries) * 100).toFixed(1)) : 0;

    // ከፍተኛ ውጤት ያመጡ ተማሪዎች (Top Performers)
    const topMarks = [...marks].sort((a, b) => b.total - a.total).slice(0, 10);

    return {
      reportType: 'ACADEMIC_PERFORMANCE_REPORT',
      generatedAt: new Date(),
      metrics: {
        totalMarksRecorded: totalEntries,
        schoolAverageScore: averageScore,
        passRate: `${passRate}%`,
        passedCount: passed,
        failedCount: failed,
      },
      topPerformers: topMarks.map((m) => ({
        studentName: m.student.user.fullName,
        className: m.student.class?.name || 'N/A',
        subject: m.subject.name,
        score: m.total,
      })),
    };
  }

  // 3. የክፍያ እና ገቢ አሰባሰብ ሪፖርት (Fee Collection Report)
  async getFeeCollectionReport() {
    const payments = await this.prisma.payment.findMany({
      include: {
        student: { include: { user: { select: { fullName: true } } } },
      },
    });

    const totalInvoiced = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const paidPayments = payments.filter((p) => p.status === PaymentStatus.PAID);
    const totalCollected = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const pendingPayments = payments.filter((p) => p.status === PaymentStatus.PENDING);
    const totalPending = pendingPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    const now = new Date();
    const overduePayments = pendingPayments.filter((p) => now > new Date(p.dueDate));
    const totalOverdue = overduePayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const recoveryRate = totalInvoiced > 0 ? Number(((totalCollected / totalInvoiced) * 100).toFixed(1)) : 0;

    return {
      reportType: 'FEE_COLLECTION_REPORT',
      generatedAt: new Date(),
      metrics: {
        totalInvoicedAmount: totalInvoiced,
        totalCollectedAmount: totalCollected,
        totalPendingAmount: totalPending,
        totalOverdueAmount: totalOverdue,
        recoveryRate: `${recoveryRate}%`,
        totalTransactions: payments.length,
        completedTransactions: paidPayments.length,
      },
      overdueList: overduePayments.map((p) => ({
        student: p.student.user.fullName,
        amount: Number(p.amount),
        dueDate: p.dueDate,
      })),
    };
  }

  // 4. የመምህራን አፈጻጸም ሪፖርት (Teacher Performance Report)
  async getTeacherPerformanceReport() {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        roomTeacherOf: { select: { id: true, name: true } },
        marks: { select: { id: true } },
        resources: { select: { id: true } },
      },
    });

    return {
      reportType: 'TEACHER_PERFORMANCE_REPORT',
      generatedAt: new Date(),
      teachers: teachers.map((t) => ({
        id: t.id,
        name: t.user.fullName,
        email: t.user.email,
        roomClass: t.roomTeacherOf?.name || 'None',
        totalMarksEntered: t.marks.length,
        totalResourcesUploaded: t.resources.length,
        complianceStatus: t.marks.length > 0 ? 'ACTIVE_COMPLIANT' : 'PENDING_GRADES',
      })),
    };
  }
}
