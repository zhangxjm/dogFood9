import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';
import { EnergyConsumption } from './energy-consumption.entity';
import { Scene } from './scene.entity';

export enum RoomStatus {
  VACANT = 'vacant',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  roomNumber: string;

  @Column()
  floor: number;

  @Column()
  roomType: string;

  @Column({ default: 0 })
  pricePerNight: number;

  @Column({
    type: 'simple-enum',
    enum: RoomStatus,
    default: RoomStatus.VACANT,
  })
  status: RoomStatus;

  @Column({ default: true })
  powerEnabled: boolean;

  @ManyToOne(() => User, user => user.rooms, { nullable: true })
  currentGuest: User;

  @Column({ nullable: true })
  checkInTime: Date;

  @Column({ nullable: true })
  checkOutTime: Date;

  @OneToMany(() => Device, device => device.room)
  devices: Device[];

  @OneToMany(() => Scene, scene => scene.room)
  scenes: Scene[];

  @OneToMany(() => EnergyConsumption, ec => ec.room)
  energyConsumptions: EnergyConsumption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
