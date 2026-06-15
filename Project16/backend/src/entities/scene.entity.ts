import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Room } from './room.entity';

@Entity('scenes')
export class Scene {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json' })
  deviceStates: Record<string, any>;

  @ManyToOne(() => Room, room => room.scenes, { nullable: true })
  room: Room;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({ nullable: true })
  icon: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
