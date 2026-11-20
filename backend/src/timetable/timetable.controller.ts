import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Timetable')
@ApiBearerAuth()
@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get('class/:classId')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER, Role.PARENT, Role.STUDENT)
  getClassTimetable(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.timetableService.getClassTimetable(classId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  createEntry(@Body() dto: CreateTimetableDto) {
    return this.timetableService.createEntry(dto);
  }

  @Post('generate/:classId')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR)
  autoGenerateTimetable(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.timetableService.autoGenerateTimetable(classId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.timetableService.removeEntry(id);
  }
}
