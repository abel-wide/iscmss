import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ROOM_TEACHER, Role.ADMIN)
  markAttendance(@Body() dto: CreateAttendanceDto, @CurrentUser('userId') userId: string) {
    return this.attendanceService.markAttendance(dto, userId);
  }

  @Post('bulk')
  @Roles(Role.TEACHER, Role.ROOM_TEACHER, Role.ADMIN)
  markBulkAttendance(@Body() dto: BulkAttendanceDto, @CurrentUser('userId') userId: string) {
    return this.attendanceService.markBulkAttendance(dto, userId);
  }

  @Get('reports')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER)
  getAttendanceReport(
    @Query('classId') classId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getAttendanceReport(classId, startDate, endDate);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER)
  findAllAttendances(
    @Query('classId') classId?: string,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.findAllAttendances(classId, date);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER, Role.PARENT, Role.STUDENT)
  findStudentAttendance(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.attendanceService.findStudentAttendance(studentId);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ROOM_TEACHER, Role.ADMIN)
  updateAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.attendanceService.updateAttendance(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.removeAttendance(id);
  }
}
