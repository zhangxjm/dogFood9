import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { Device } from '../entities/device.entity';
import { DeviceLog } from '../entities/device-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User, Device, DeviceLog])],
  providers: [RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
