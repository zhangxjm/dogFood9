import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Room } from './room.entity';

export enum DeviceType {
  LIGHT = 'light',
  AC = 'ac',
  CURTAIN = 'curtain',
  TV = 'tv',
}

export enum DeviceStatus {
  ON = 'on',
  OFF = 'off',
  STANDBY = 'standby',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: DeviceType,
  })
  type: DeviceType;

  @Column({
    type: 'simple-enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFF,
  })
  status: DeviceStatus;

  @Column({ type: 'json', default: '{}' })
  state: Record<string, any>;

  @Column({ default: 0 })
  powerRating: number;

  @ManyToOne(() => Room, room => room.devices)
  room: Room;

  @Column({ default: true })
  isOnline: boolean;

  @Column({ nullable: true })
  lastCommandTime: Date;

  @Column({ nullable: true })
  lastStateChangeTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
