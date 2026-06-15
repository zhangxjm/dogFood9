import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { Device } from '../entities/device.entity';
import { DeviceLog } from '../entities/device-log.entity';
import { Room } from '../entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, DeviceLog, Room])],
  providers: [DeviceService],
  controllers: [DeviceController],
  exports: [DeviceService],
})
export class DeviceModule {}
