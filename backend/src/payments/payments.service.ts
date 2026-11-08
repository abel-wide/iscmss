import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { MakePaymentDto } from './dto/make-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ የክፍያ መረጃ መፍጠር (Admin/Registrar)
  async createPayment(dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        status: PaymentStatus.PENDING,
      },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  // 2. ሁሉንም ክፍያዎች ማየት (በተማሪ ወይም በሁኔታ ማጣራት ይቻላል)
  async findAllPayments(studentId?: string, status?: PaymentStatus) {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    return this.prisma.payment.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  // 3. አንድ ክፍያ በ ID ማየት
  async findOnePayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  // 4. ክፍያ ማድረግ (Payment Gateway Simulation)
  async makePayment(id: string, dto: MakePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.PAID) {
      throw new ConflictException('Payment already completed');
    }

    const receiptNo = `RCP-${Date.now()}`;

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        transactionId: dto.transactionId,
        receiptNo: receiptNo,
      },
    });
  }

  // 5. ክፍያ ማስተካከል
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

  // 6. ክፍያ ማጥፋት
  async removePayment(id: string) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payment not found');

    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment deleted successfully' };
  }
}