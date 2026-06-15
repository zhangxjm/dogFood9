import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus, DeviceType } from '../entities/device.entity';
import { DeviceLog, LogAction } from '../entities/device-log.entity';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class DeviceService {
  private commandQueue: Map<string, Array<{ resolve: Function; reject: Function; command: any }>> = new Map();

  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(DeviceLog)
    private deviceLogRepository: Repository<DeviceLog>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async findAll(filters?: any): Promise<Device[]> {
    const query = this.deviceRepository.createQueryBuilder('device')
      .leftJoinAndSelect('device.room', 'room');

    if (filters?.roomId) {
      query.andWhere('device.roomId = :roomId', { roomId: filters.roomId });
    }
    if (filters?.type) {
      query.andWhere('device.type = :type', { type: filters.type });
    }
    if (filters?.status) {
      query.andWhere('device.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['room'],
    });
    if (!device) {
      throw new NotFoundException('设备不存在');
    }
    return device;
  }

  async create(data: Partial<Device>): Promise<Device> {
    const device = this.deviceRepository.create(data);
    return this.deviceRepository.save(device);
  }

  async update(id: string, data: Partial<Device>): Promise<Device> {
    await this.deviceRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.deviceRepository.delete(id);
  }

  async controlDevice(deviceId: string, action: string, params?: any, userId?: string): Promise<Device> {
    const startTime = Date.now();
    const device = await this.findOne(deviceId);
    const room = await this.roomRepository.findOne({ where: { id: device.room.id } });

    if (!room.powerEnabled) {
      throw new BadRequestException('房间电源已断开，无法控制设备');
    }

    const oldState = { ...device.state, status: device.status };
    let logAction: LogAction = LogAction.STATE_CHANGE;

    try {
      switch (action) {
        case 'turn_on':
          device.status = DeviceStatus.ON;
          logAction = LogAction.TURN_ON;
          break;
        case 'turn_off':
          device.status = DeviceStatus.OFF;
          logAction = LogAction.TURN_OFF;
          break;
        case 'toggle':
          device.status = device.status === DeviceStatus.ON ? DeviceStatus.OFF : DeviceStatus.ON;
          logAction = device.status === DeviceStatus.ON ? LogAction.TURN_ON : LogAction.TURN_OFF;
          break;
        case 'set_state':
          device.state = { ...device.state, ...params };
          logAction = LogAction.STATE_CHANGE;
          break;
        default:
          throw new BadRequestException('不支持的操作');
      }

      device.lastCommandTime = new Date();
      device.lastStateChangeTime = new Date();

      const updatedDevice = await this.deviceRepository.save(device);

      const log = this.deviceLogRepository.create({
        device,
        user: userId ? { id: userId } as User : null,
        action: logAction,
        oldState,
        newState: { ...updatedDevice.state, status: updatedDevice.status },
        success: true,
        responseTime: Date.now() - startTime,
      });
      await this.deviceLogRepository.save(log);

      return updatedDevice;
    } catch (error) {
      const log = this.deviceLogRepository.create({
        device,
        user: userId ? { id: userId } as User : null,
        action: logAction,
        oldState,
        newState: params,
        success: false,
        errorMessage: error.message,
        responseTime: Date.now() - startTime,
      });
      await this.deviceLogRepository.save(log);
      throw error;
    }
  }

  async setDeviceState(deviceId: string, state: Record<string, any>, userId?: string): Promise<Device> {
    return this.controlDevice(deviceId, 'set_state', state, userId);
  }

  async turnOn(deviceId: string, userId?: string): Promise<Device> {
    return this.controlDevice(deviceId, 'turn_on', null, userId);
  }

  async turnOff(deviceId: string, userId?: string): Promise<Device> {
    return this.controlDevice(deviceId, 'turn_off', null, userId);
  }

  async toggle(deviceId: string, userId?: string): Promise<Device> {
    return this.controlDevice(deviceId, 'toggle', null, userId);
  }

  async getDeviceLogs(deviceId: string, limit: number = 50): Promise<DeviceLog[]> {
    return this.deviceLogRepository.find({
      where: { device: { id: deviceId } },
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getDeviceStatus(deviceId: string): Promise<any> {
    const device = await this.findOne(deviceId);
    const logs = await this.getDeviceLogs(deviceId, 10);
    return {
      device,
      recentLogs: logs,
      isOnline: device.isOnline,
      lastCommand: device.lastCommandTime,
      lastStateChange: device.lastStateChangeTime,
    };
  }

  async executeScene(deviceStates: Array<{ deviceId: string; state: any }>, userId?: string): Promise<Device[]> {
    const results: Device[] = [];
    
    for (const { deviceId, state } of deviceStates) {
      try {
        const device = await this.findOne(deviceId);
        
        if (state.status === 'on') {
          await this.turnOn(deviceId, userId);
        } else if (state.status === 'off') {
          await this.turnOff(deviceId, userId);
        }
        
        if (state.settings) {
          await this.setDeviceState(deviceId, state.settings, userId);
        }
        
        const updatedDevice = await this.findOne(deviceId);
        results.push(updatedDevice);
      } catch (error) {
        console.error(`Failed to control device ${deviceId}:`, error);
      }
    }
    
    return results;
  }

  async controlLight(deviceId: string, action: string, params?: any, userId?: string): Promise<Device> {
    const device = await this.findOne(deviceId);
    if (device.type !== DeviceType.LIGHT) {
      throw new BadRequestException('该设备不是灯光');
    }
    return this.controlDevice(deviceId, action, params, userId);
  }

  async controlAC(deviceId: string, action: string, params?: any, userId?: string): Promise<Device> {
    const device = await this.findOne(deviceId);
    if (device.type !== DeviceType.AC) {
      throw new BadRequestException('该设备不是空调');
    }
    return this.controlDevice(deviceId, action, params, userId);
  }

  async controlCurtain(deviceId: string, action: string, params?: any, userId?: string): Promise<Device> {
    const device = await this.findOne(deviceId);
    if (device.type !== DeviceType.CURTAIN) {
      throw new BadRequestException('该设备不是窗帘');
    }
    return this.controlDevice(deviceId, action, params, userId);
  }

  async controlTV(deviceId: string, action: string, params?: any, userId?: string): Promise<Device> {
    const device = await this.findOne(deviceId);
    if (device.type !== DeviceType.TV) {
      throw new BadRequestException('该设备不是电视');
    }
    return this.controlDevice(deviceId, action, params, userId);
  }
}
