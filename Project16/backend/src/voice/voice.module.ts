import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
import { Device } from '../entities/device.entity';
import { Scene } from '../entities/scene.entity';
import { DeviceLog } from '../entities/device-log.entity';
import { DeviceModule } from '../device/device.module';
import { SceneModule } from '../scene/scene.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Scene, DeviceLog]),
    DeviceModule,
    SceneModule,
  ],
  providers: [VoiceService],
  controllers: [VoiceController],
  exports: [VoiceService],
})
export class VoiceModule {}
