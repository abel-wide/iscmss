import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @Roles(
    Role.ADMIN,
    Role.HEAD,
    Role.REGISTRAR,
    Role.TEACHER,
    Role.ROOM_TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.HEAD,
    Role.REGISTRAR,
    Role.TEACHER,
    Role.ROOM_TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }
}
