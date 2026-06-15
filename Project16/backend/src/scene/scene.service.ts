import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scene } from '../entities/scene.entity';
import { DeviceService } from '../device/device.service';
import { Device } from '../entities/device.entity';
import { Room } from '../entities/room.entity';

@Injectable()
export class SceneService {
  constructor(
    @InjectRepository(Scene)
    private sceneRepository: Repository<Scene>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private deviceService: DeviceService,
  ) {}

  async findAll(roomId?: string): Promise<Scene[]> {
    const query = this.sceneRepository.createQueryBuilder('scene')
      .leftJoinAndSelect('scene.room', 'room');

    if (roomId) {
      query.where('scene.roomId = :roomId OR scene.isGlobal = :isGlobal', { roomId, isGlobal: true });
    } else {
      query.where('scene.isGlobal = :isGlobal', { isGlobal: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Scene> {
    const scene = await this.sceneRepository.findOne({
      where: { id },
      relations: ['room'],
    });
    if (!scene) {
      throw new NotFoundException('场景不存在');
    }
    return scene;
  }

  async create(data: Partial<Scene>): Promise<Scene> {
    const scene = this.sceneRepository.create(data);
    return this.sceneRepository.save(scene);
  }

  async update(id: string, data: Partial<Scene>): Promise<Scene> {
    await this.sceneRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.sceneRepository.delete(id);
  }

  async activateScene(sceneId: string, userId?: string): Promise<Device[]> {
    const scene = await this.findOne(sceneId);
    const deviceStates: Array<{ deviceId: string; state: any }> = [];

    if (scene.isGlobal && scene.room) {
      const devices = await this.deviceRepository.find({
        where: { room: { id: scene.room.id } },
      });
      
      for (const device of devices) {
        const type = device.type;
        if (scene.deviceStates[type]) {
          deviceStates.push({
            deviceId: device.id,
            state: scene.deviceStates[type],
          });
        }
      }
    } else if (scene.deviceStates) {
      for (const [deviceId, state] of Object.entries(scene.deviceStates)) {
        deviceStates.push({
          deviceId,
          state: state as any,
        });
      }
    }

    return this.deviceService.executeScene(deviceStates, userId);
  }

  async activateSceneForRoom(sceneId: string, roomId: string, userId?: string): Promise<Device[]> {
    const scene = await this.findOne(sceneId);
    const devices = await this.deviceRepository.find({
      where: { room: { id: roomId } },
    });

    const deviceStates: Array<{ deviceId: string; state: any }> = [];

    for (const device of devices) {
      const type = device.type;
      if (scene.deviceStates[type]) {
        deviceStates.push({
          deviceId: device.id,
          state: scene.deviceStates[type],
        });
      }
    }

    return this.deviceService.executeScene(deviceStates, userId);
  }

  async createDefaultScenes(roomId: string): Promise<Scene[]> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('房间不存在');
    }

    const defaultScenes = [
      {
        name: '睡眠模式',
        description: '关闭所有灯光，调暗空调，关闭窗帘',
        icon: 'moon',
        deviceStates: {
          light: { status: 'off' },
          ac: { status: 'on', settings: { temperature: 26, mode: 'sleep', fanSpeed: 'low' } },
          curtain: { status: 'on', settings: { position: 100 } },
          tv: { status: 'off' },
        },
      },
      {
        name: '阅读模式',
        description: '开启床头灯，调节适宜亮度',
        icon: 'book',
        deviceStates: {
          light: { status: 'on', settings: { brightness: 60, color: 'warm' } },
          ac: { status: 'on', settings: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
          curtain: { status: 'on', settings: { position: 50 } },
          tv: { status: 'off' },
        },
      },
      {
        name: '观影模式',
        description: '调暗灯光，开启电视，关闭窗帘',
        icon: 'video',
        deviceStates: {
          light: { status: 'on', settings: { brightness: 20, color: 'warm' } },
          ac: { status: 'on', settings: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
          curtain: { status: 'on', settings: { position: 100 } },
          tv: { status: 'on', settings: { volume: 25, source: 'hdmi1' } },
        },
      },
      {
        name: '离开模式',
        description: '关闭所有设备',
        icon: 'logout',
        deviceStates: {
          light: { status: 'off' },
          ac: { status: 'off' },
          curtain: { status: 'off', settings: { position: 0 } },
          tv: { status: 'off' },
        },
      },
      {
        name: '回家模式',
        description: '开启主灯和空调，打开窗帘',
        icon: 'home',
        deviceStates: {
          light: { status: 'on', settings: { brightness: 100, color: 'warm' } },
          ac: { status: 'on', settings: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
          curtain: { status: 'on', settings: { position: 0 } },
          tv: { status: 'off' },
        },
      },
      {
        name: '浪漫模式',
        description: '柔和灯光，温馨氛围',
        icon: 'heart',
        deviceStates: {
          light: { status: 'on', settings: { brightness: 30, color: 'warm' } },
          ac: { status: 'on', settings: { temperature: 25, mode: 'cool', fanSpeed: 'low' } },
          curtain: { status: 'on', settings: { position: 80 } },
          tv: { status: 'off' },
        },
      },
    ];

    const createdScenes: Scene[] = [];
    for (const sceneData of defaultScenes) {
      const scene = this.sceneRepository.create({
        ...sceneData,
        room,
        isGlobal: false,
      });
      createdScenes.push(await this.sceneRepository.save(scene));
    }

    return createdScenes;
  }

  async getRoomScenes(roomId: string): Promise<Scene[]> {
    return this.sceneRepository.find({
      where: [
        { room: { id: roomId } },
        { isGlobal: true },
      ],
      order: { createdAt: 'ASC' },
    });
  }
}
