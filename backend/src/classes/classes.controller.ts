import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  createClass(@Body() dto: CreateClassDto) {
    return this.classesService.createClass(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER)
  findAllClasses() {
    return this.classesService.findAllClasses();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.TEACHER, Role.ROOM_TEACHER)
  findOneClass(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findOneClass(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  updateClass(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.updateClass(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeClass(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.removeClass(id);
  }
}