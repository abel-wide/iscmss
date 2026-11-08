import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users') // በ Swagger ላይ የሚታይ ስም
@ApiBearerAuth() // ሁሉም ኤፒአይዎች Token እንደሚፈልጉ ያሳያል
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('teachers')
  @Roles(Role.ADMIN)
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacher(dto);
  }

  @Get('teachers')
  @Roles(Role.ADMIN)
  findAllTeachers() {
    return this.usersService.findAllTeachers();
  }

  @Get('teachers/:id')
  @Roles(Role.ADMIN)
  findOneTeacher(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOneTeacher(id);
  }

  @Patch('teachers/:id')
  @Roles(Role.ADMIN)
  updateTeacher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.usersService.updateTeacher(id, dto);
  }

  @Delete('teachers/:id')
  @Roles(Role.ADMIN)
  removeTeacher(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.removeTeacher(id);
  }
}