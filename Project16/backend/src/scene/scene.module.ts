import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SceneService } from './scene.service';
import { SceneController } from './scene.controller';
import { Scene } from '../entities/scene.entity';
import { Device } from '../entities/device.entity';
import { Room } from '../entities/room.entity';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Scene, Device, Room]),
    DeviceModule,
  ],
  providers: [SceneService],
  controllers: [SceneController],
  exports: [SceneService],
})
export class SceneModule {}
