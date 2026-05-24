// src/gateway/app.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '@clerk/backend';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private userSockets = new Map<string, Set<string>>();

  async handleConnection(client: Socket) {
    // Token is sent from the client as: io(url, { auth: { token } })
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      // Store verified userId on the socket — register message no longer needed
      const userId = payload.sub;
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
    } catch {
      // Invalid or expired token — reject the connection
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(client.id);
    if (sockets.size === 0) this.userSockets.delete(userId);
  }

  // Register message no longer needed — userId comes from verified token on connect
  // Keeping it as a no-op so old clients don't break during deploys
  @SubscribeMessage('register')
  register(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {}

  notifyUser(userId: string, event: string, payload: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const sid of sockets) {
      this.server.to(sid).emit(event, payload);
    }
  }
}
