import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { DeviceModule } from './device/device.module';
import { SceneModule } from './scene/scene.module';
import { VoiceModule } from './voice/voice.module';
import { EnergyModule } from './energy/energy.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    RoomModule,
    DeviceModule,
    SceneModule,
    VoiceModule,
    EnergyModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
