import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/interfaces';

// @WebSocketGateway({ cors: true, namespace: '/' }) // namespace => space of chat
@WebSocketGateway({ cors: true }) 
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{ // implemest, which is connect and disconnect
  
  @WebSocketServer() webSocketServer: Server;
  
  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService:  JwtService
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    
    let payload: JwtPayload;

    try {
    
      payload = this.jwtService.verify( token );
      await this.messagesWsService.registerClient(client, payload.id);

    } catch (error) {

      client.disconnect()
      return;

    }

    // console.log({payload});

    this.webSocketServer.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id);

    this.webSocketServer.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  @SubscribeMessage('messages-from-server')
  async onMessageFromClient( client: Socket, payload: NewMessageDto ){

    // emit to one client
    // client.emit('messages-from-server',{
    //   fullName: 'user',
    //   message: payload.message || 'no-message'
    // })


    //emit all client but not client: Socket
    // client.broadcast.emit('messages-from-server',{
    //   fullName: 'user',
    //   message: payload.message || 'no-message'
    // })

    // emit all customers
    this.webSocketServer.emit('messages-from-server',{
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message'
    })

  }

}
