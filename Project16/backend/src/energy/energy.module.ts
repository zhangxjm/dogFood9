import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EnergyService } from './energy.service';
import { EnergyController } from './energy.controller';
import { EnergyConsumption } from '../entities/energy-consumption.entity';
import { Room } from '../entities/room.entity';
import { Device } from '../entities/device.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyConsumption, Room, Device]),
    ScheduleModule.forRoot(),
  ],
  providers: [EnergyService],
  controllers: [EnergyController],
  exports: [EnergyService],
})
export class EnergyModule {}
