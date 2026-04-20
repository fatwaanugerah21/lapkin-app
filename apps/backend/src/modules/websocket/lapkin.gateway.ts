import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../common/types';
import { LapkinResponseDto } from '../lapkin/lapkin.dto';
import { parseFrontendCorsOrigins } from '../../common/parse-frontend-cors-origins';

@WebSocketGateway({
  cors: { origin: parseFrontendCorsOrigins(), credentials: true },
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

  /** Notify the LAPKIN owner's direct supervisor (room user:{supervisorId}). */
  notifySupervisorLapkinLocked(supervisorId: string | null, lapkin: LapkinResponseDto): void {
    if (!supervisorId) return;
    this.server.to(`user:${supervisorId}`).emit('lapkin:locked', lapkin);
  }

  notifySupervisorLapkinUnlocked(supervisorId: string | null, lapkin: LapkinResponseDto): void {
    if (!supervisorId) return;
    this.server.to(`user:${supervisorId}`).emit('lapkin:unlocked', lapkin);
  }

  notifyPegawaiLapkinEvaluated(lapkin: LapkinResponseDto): void {
    this.server.to(`user:${lapkin.employeeId}`).emit('lapkin:evaluated', lapkin);
  }

  notifySupervisorLapkinEmployeeSigned(supervisorId: string | null, lapkin: LapkinResponseDto): void {
    if (!supervisorId) return;
    this.server.to(`user:${supervisorId}`).emit('lapkin:employee-signed', lapkin);
  }

  private extractToken(socket: Socket): string {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const match = cookieHeader.match(/access_token=([^;]+)/);
    if (!match) throw new Error('No token');
    return match[1];
  }
}
