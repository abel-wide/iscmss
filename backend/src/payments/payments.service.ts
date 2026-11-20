import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { MakePaymentDto } from './dto/make-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // የዘገየ ክፍያ ቅጣት ማስያ (Late Fee Penalty Calculation: 5% after due date)
  private calculatePenalty(amount: number, dueDate: Date, status: PaymentStatus): number {
    if (status === PaymentStatus.PAID) return 0;
    const now = new Date();
    if (now > new Date(dueDate)) {
      // 5% late penalty
      return Number((amount * 0.05).toFixed(2));
    }
    return 0;
  }

  // 1. አዲስ የክፍያ መረጃ መፍጠር (Admin/Registrar)
  async createPayment(dto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        status: PaymentStatus.PENDING,
      },
      include: {
        student: { include: { user: { select: { fullName: true } }, parent: true } },
      },
    });

    // ለወላጅ ማሳወቂያ መላክ
    if (payment.student?.parentId) {
      await this.prisma.notification.create({
        data: {
          recipientId: payment.student.parentId,
          title: 'Fee Payment Invoiced',
          message: `A tuition fee of $${payment.amount} has been issued for ${payment.student.user.fullName}. Due Date: ${new Date(payment.dueDate).toLocaleDateString()}.`,
          type: 'PAYMENT_REMINDER',
        },
      });
    }

    return payment;
  }

  // 2. ሁሉንም ክፍያዎች ማየት (ቅጣቱን አካቶ)
  async findAllPayments(studentId?: string, status?: PaymentStatus) {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } }, class: true } },
      },
      orderBy: { dueDate: 'desc' },
    });

    return payments.map((p) => {
      const penalty = this.calculatePenalty(Number(p.amount), p.dueDate, p.status);
      const isOverdue = new Date() > new Date(p.dueDate) && p.status === PaymentStatus.PENDING;
      return {
        ...p,
        penalty,
        totalDue: Number(p.amount) + penalty,
        isOverdue,
      };
    });
  }

  // 3. አንድ ክፍያ በ ID ማየት
  async findOnePayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { fullName: true } }, class: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const penalty = this.calculatePenalty(Number(payment.amount), payment.dueDate, payment.status);
    return {
      ...payment,
      penalty,
      totalDue: Number(payment.amount) + penalty,
      isOverdue: new Date() > new Date(payment.dueDate) && payment.status === PaymentStatus.PENDING,
    };
  }

  // 4. ክፍያ ማድረግ (Make Payment Simulation with Receipt generation)
  async makePayment(id: string, dto: MakePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { student: { include: { user: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.PAID) {
      throw new ConflictException('Payment already completed');
    }

    const penalty = this.calculatePenalty(Number(payment.amount), payment.dueDate, payment.status);
    const totalAmount = Number(payment.amount) + penalty;
    const receiptNo = `RCP-${Date.now().toString().slice(-8)}`;

    const completedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        transactionId: dto.transactionId || `TXN-${Date.now()}`,
        receiptNo: receiptNo,
      },
    });

    // ለወላጅ ዲጂታል ደረሰኝ ማሳወቂያ መላክ
    if (payment.student?.parentId) {
      await this.prisma.notification.create({
        data: {
          recipientId: payment.student.parentId,
          title: 'Payment Successful',
          message: `Payment of $${totalAmount} received for ${payment.student.user.fullName}. Receipt No: ${receiptNo}.`,
          type: 'PAYMENT_RECEIPT',
        },
      });
    }

    return {
      ...completedPayment,
      paidAmount: totalAmount,
      penalty,
    };
  }

  // 5. ዲጂታል ደረሰኝ ማውጣት (Digital Receipt)
  async getReceipt(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status !== PaymentStatus.PAID) {
      throw new ConflictException('Receipt is only available for completed payments');
    }

    return {
      institution: 'ISCMSS - International Smart Campus School System',
      receiptNumber: payment.receiptNo,
      transactionId: payment.transactionId,
      paidDate: payment.paidAt,
      studentName: payment.student.user.fullName,
      studentClass: payment.student.class?.name || 'N/A',
      baseFee: Number(payment.amount),
      penalty: 0,
      totalAmountPaid: Number(payment.amount),
      status: 'VERIFIED_PAID',
      digitalSignature: `SIG-${Buffer.from(payment.id + payment.receiptNo).toString('base64').slice(0, 20)}`,
    };
  }

  // 6. አውቶሜትድ የክፍያ ማሳሰቢያ መላክ (Automated Reminders)
  async dispatchReminders() {
    const now = new Date();
    const upcomingThreshold = new Date();
    upcomingThreshold.setDate(now.getDate() + 7);

    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: { lte: upcomingThreshold },
      },
      include: {
        student: { include: { user: true, parent: true } },
      },
    });

    let dispatchedCount = 0;
    for (const p of pendingPayments) {
      if (p.student?.parentId) {
        const isOverdue = now > new Date(p.dueDate);
        const title = isOverdue ? 'URGENT: Fee Payment Overdue' : 'Reminder: Upcoming Fee Due';
        const msg = isOverdue
          ? `Tuition for ${p.student.user.fullName} of $${p.amount} is overdue since ${new Date(p.dueDate).toLocaleDateString()}. Late penalties apply.`
          : `Upcoming tuition payment of $${p.amount} for ${p.student.user.fullName} is due on ${new Date(p.dueDate).toLocaleDateString()}.`;

        await this.prisma.notification.create({
          data: {
            recipientId: p.student.parentId,
            title,
            message: msg,
            type: 'PAYMENT_REMINDER',
          },
        });
        dispatchedCount++;
      }
    }

    return { message: `Successfully dispatched ${dispatchedCount} payment reminders`, count: dispatchedCount };
  }

  // 7. ክፍያ ማስተካከል
  async updatePayment(id: string, dto: UpdatePaymentDto) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payment not found');

    return this.prisma.payment.update({
      where: { id },
      data: {
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  // 8. ክፍያ ማጥፋት
  async removePayment(id: string) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payment not found');

    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment deleted successfully' };
  }
}
