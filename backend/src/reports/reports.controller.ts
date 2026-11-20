import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('attendance')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR)
  getAttendanceReport(
    @Query('classId') classId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getAttendanceReport(classId, startDate, endDate);
  }

  @Get('academics')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR)
  getAcademicReport(@Query('classId') classId?: string) {
    return this.reportsService.getAcademicReport(classId);
  }

  @Get('fees')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR)
  getFeeCollectionReport() {
    return this.reportsService.getFeeCollectionReport();
  }

  @Get('teachers')
  @Roles(Role.ADMIN, Role.HEAD)
  getTeacherPerformanceReport() {
    return this.reportsService.getTeacherPerformanceReport();
  }
}
