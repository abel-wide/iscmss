import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { MakePaymentDto } from './dto/make-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, PaymentStatus } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Post('reminders')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  dispatchReminders() {
    return this.paymentsService.dispatchReminders();
  }

  @Get()
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR, Role.PARENT)
  findAllPayments(
    @Query('studentId') studentId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.paymentsService.findAllPayments(studentId, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR, Role.PARENT)
  findOnePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOnePayment(id);
  }

  @Get(':id/receipt')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR, Role.PARENT, Role.STUDENT)
  getReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.getReceipt(id);
  }

  @Post(':id/pay')
  @Roles(Role.PARENT, Role.ADMIN)
  makePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MakePaymentDto,
  ) {
    return this.paymentsService.makePayment(id, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updatePayment(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.removePayment(id);
  }
}
