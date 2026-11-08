import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  createStudent(@Body() dto: CreateStudentDto) {
    return this.studentsService.createStudent(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER)
  findAllStudents() {
    return this.studentsService.findAllStudents();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER)
  findOneStudent(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOneStudent(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  updateStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.updateStudent(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeStudent(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.removeStudent(id);
  }
}