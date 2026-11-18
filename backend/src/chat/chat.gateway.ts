import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('joinRoom')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    client.join(userId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
  ) {
    const message = await this.chatService.saveMessage(data.senderId, data.receiverId, data.content);
    
    // Send to receiver's room and sender's room
    this.server.to(data.receiverId).emit('newMessage', message);
    this.server.to(data.senderId).emit('newMessage', message);
    
    return message;
  }
}