import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Room } from './room.entity';
import { EnergyConsumption } from './energy-consumption.entity';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  GUEST = 'guest',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.GUEST,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  idCard: string;

  @OneToMany(() => Room, room => room.currentGuest)
  rooms: Room[];

  @OneToMany(() => EnergyConsumption, ec => ec.user)
  energyConsumptions: EnergyConsumption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
