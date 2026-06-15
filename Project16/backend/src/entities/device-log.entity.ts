import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Device } from './device.entity';
import { User } from './user.entity';

export enum LogAction {
  TURN_ON = 'turn_on',
  TURN_OFF = 'turn_off',
  STATE_CHANGE = 'state_change',
  SCENE_ACTIVATE = 'scene_activate',
  VOICE_CONTROL = 'voice_control',
}

@Entity('device_logs')
export class DeviceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Device)
  device: Device;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({
    type: 'simple-enum',
    enum: LogAction,
  })
  action: LogAction;

  @Column({ type: 'json', nullable: true })
  oldState: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  newState: Record<string, any>;

  @Column({ default: false })
  success: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  responseTime: number;

  @CreateDateColumn()
  timestamp: Date;
}
