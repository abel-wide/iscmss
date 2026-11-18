import { Controller, Get, Post, Body, Delete, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Resources')
@ApiBearerAuth()
@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ROOM_TEACHER, Role.ADMIN)
  createResource(@Body() dto: CreateResourceDto) {
    return this.resourcesService.createResource(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER, Role.PARENT, Role.STUDENT, Role.ROOM_TEACHER)
  findAllResources() {
    return this.resourcesService.findAllResources();
  }

  @Get('teacher/:teacherId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.PARENT, Role.STUDENT, Role.ROOM_TEACHER)
  findResourcesByTeacher(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.resourcesService.findResourcesByTeacher(teacherId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  removeResource(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.removeResource(id);
  }
}