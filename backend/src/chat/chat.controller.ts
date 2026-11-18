import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':user1Id/:user2Id')
  getConversation(@Param('user1Id') user1Id: string, @Param('user2Id') user2Id: string) {
    return this.chatService.getConversation(user1Id, user2Id);
  }
}