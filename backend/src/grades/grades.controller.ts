import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateMarkDto } from './dto/create-mark.dto';
import { UpdateMarkDto } from './dto/update-mark.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Grades')
@ApiBearerAuth()
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ROOM_TEACHER, Role.ADMIN)
  createMark(@Body() dto: CreateMarkDto) {
    return this.gradesService.createMark(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER)
  findAllMarks(
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.gradesService.findAllMarks(studentId, subjectId);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER, Role.PARENT, Role.STUDENT)
  findStudentMarks(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.gradesService.findStudentMarks(studentId);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ROOM_TEACHER, Role.ADMIN)
  updateMark(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarkDto,
  ) {
    return this.gradesService.updateMark(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeMark(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.removeMark(id);
  }
}