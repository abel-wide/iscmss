import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Exams')
@ApiBearerAuth()
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.HEAD, Role.TEACHER, Role.STUDENT)
  getAvailableExams() {
    return this.examsService.getAvailableExams();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HEAD, Role.TEACHER, Role.STUDENT)
  getExamForStudent(@Param('id') id: string) {
    return this.examsService.getExamForStudent(id);
  }

  @Post('submit')
  @Roles(Role.STUDENT, Role.ADMIN, Role.TEACHER)
  submitAndAutoGrade(
    @Body()
    body: {
      examId: string;
      studentId: string;
      answers: Record<string, number>;
    },
  ) {
    return this.examsService.submitAndAutoGrade(body);
  }
}
