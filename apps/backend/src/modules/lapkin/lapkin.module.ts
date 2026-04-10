import { Module } from '@nestjs/common';
import { LapkinService } from './lapkin.service';
import { LapkinController } from './lapkin.controller';
import { LapkinGateway } from '../websocket/lapkin.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [LapkinService, LapkinGateway],
  controllers: [LapkinController],
})
export class LapkinModule {}
