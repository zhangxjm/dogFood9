import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DeviceGateway } from './device.gateway';
import { DeviceModule } from '../device/device.module';
import { RoomModule } from '../room/room.module';
import { SceneModule } from '../scene/scene.module';
import { VoiceModule } from '../voice/voice.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'hotel-iot-secret-key-2024',
    }),
    DeviceModule,
    RoomModule,
    SceneModule,
    VoiceModule,
  ],
  providers: [DeviceGateway],
  exports: [DeviceGateway],
})
export class WebsocketModule {}
