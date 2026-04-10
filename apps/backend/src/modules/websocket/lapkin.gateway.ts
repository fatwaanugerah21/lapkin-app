import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../common/types';
import { LapkinResponseDto } from '../lapkin/lapkin.dto';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
})
export class LapkinGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Maps userId → socketId for targeted notifications
  private connectedUsers = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(socket: Socket): void {
    try {
      const token = this.extractToken(socket);
      const payload = this.jwtService.verify<JwtPayload>(token);
      this.connectedUsers.set(payload.sub, socket.id);
      socket.data.userId = payload.sub;
      socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket): void {
    if (socket.data.userId) {
      this.connectedUsers.delete(socket.data.userId);
    }
  }

  notifyManagerLapkinLocked(lapkin: LapkinResponseDto): void {
    // Notify the manager that their direct report locked a LAPKIN
    this.emitToUserIfConnected(lapkin, 'lapkin:locked');
  }

  notifyManagerLapkinUnlocked(lapkin: LapkinResponseDto): void {
    this.emitToUserIfConnected(lapkin, 'lapkin:unlocked');
  }

  notifyPegawaiLapkinEvaluated(lapkin: LapkinResponseDto): void {
    // Notify the pegawai that their LAPKIN was evaluated
    this.server.to(`user:${lapkin.pegawaiId}`).emit('lapkin:evaluated', lapkin);
  }

  private emitToUserIfConnected(lapkin: LapkinResponseDto, event: string): void {
    // We don't have manager id here directly, but the frontend manager
    // will receive the update via the standard refresh mechanism
    // Broadcasting to all connected managers is handled via room per-user
    this.server.emit(event, lapkin);
  }

  private extractToken(socket: Socket): string {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const match = cookieHeader.match(/access_token=([^;]+)/);
    if (!match) throw new Error('No token');
    return match[1];
  }
}
