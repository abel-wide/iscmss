import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreateParentDto } from './dto/create-parent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('teachers')
  @Roles(Role.ADMIN)
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacher(dto);
  }

  @Post('staff')
  @Roles(Role.ADMIN)
  createStaff(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  @Post('parents')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  createParent(@Body() dto: CreateParentDto) {
    return this.usersService.createParent(dto);
  }

  @Post('link-parent-student')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  linkParentStudent(
    @Body('parentId', ParseUUIDPipe) parentId: string,
    @Body('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.usersService.linkParentStudent(parentId, studentId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR)
  findAllUsers(@Query('role') role?: Role) {
    return this.usersService.findAllUsers(role);
  }

  @Get('teachers')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR)
  findAllTeachers() {
    return this.usersService.findAllTeachers();
  }

  @Get('teachers/:id')
  @Roles(Role.ADMIN, Role.HEAD, Role.REGISTRAR)
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

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  toggleUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.toggleUserStatus(id, isActive);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.removeUser(id);
  }
}
