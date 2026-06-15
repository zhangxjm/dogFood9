import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';
import { Device } from './device.entity';

export enum ConsumptionType {
  ELECTRICITY = 'electricity',
  WATER = 'water',
}

@Entity('energy_consumptions')
export class EnergyConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, room => room.energyConsumptions)
  room: Room;

  @ManyToOne(() => User, user => user.energyConsumptions, { nullable: true })
  user: User;

  @ManyToOne(() => Device, { nullable: true })
  device: Device;

  @Column({
    type: 'simple-enum',
    enum: ConsumptionType,
    default: ConsumptionType.ELECTRICITY,
  })
  type: ConsumptionType;

  @Column({ type: 'float', default: 0 })
  consumption: number;

  @Column({ type: 'float', default: 0 })
  cost: number;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
