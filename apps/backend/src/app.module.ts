import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LapkinModule } from './modules/lapkin/lapkin.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    LapkinModule,
  ],
})
export class AppModule {}
