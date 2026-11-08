import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER, Role.ROOM_TEACHER)
  createNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }

  @Get('parent/:parentId')
  @Roles(Role.PARENT, Role.ADMIN)
  getParentNotifications(@Param('parentId', ParseUUIDPipe) parentId: string) {
    return this.notificationsService.getParentNotifications(parentId);
  }

  @Patch(':id/read')
  @Roles(Role.PARENT, Role.ADMIN)
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('announcements')
  @Roles(Role.ADMIN, Role.HEAD)
  createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notificationsService.createAnnouncement(dto, userId);
  }

  @Get('announcements')
  @Roles(Role.ADMIN, Role.HEAD, Role.TEACHER, Role.PARENT, Role.STUDENT)
  getAllAnnouncements() {
    return this.notificationsService.getAllAnnouncements();
  }
}