import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from './users.service';
import {UseGuards} from "@nestjs/common";
import {JwtAuthGuard} from "../../auth/jwt-auth.guard";

@WebSocketGateway({
    cors: {
        origin: '*', // Укажите разрешенные источники
    },
})
export class UsersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private readonly usersService: UsersService) {}

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @UseGuards(JwtAuthGuard)
    @SubscribeMessage('getUserData')
    async handleGetUserData(client: Socket, userId: string) {
        const userData = await this.usersService.getUser(userId);
        client.emit('userData', userData);
    }

}
