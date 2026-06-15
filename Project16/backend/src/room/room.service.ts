import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from '../entities/room.entity';
import { User, UserRole } from '../entities/user.entity';
import { Device, DeviceStatus, DeviceType } from '../entities/device.entity';
import { DeviceLog, LogAction } from '../entities/device-log.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(DeviceLog)
    private deviceLogRepository: Repository<DeviceLog>,
  ) {}

  async findAll(filters?: any): Promise<Room[]> {
    const query = this.roomRepository.createQueryBuilder('room')
      .leftJoinAndSelect('room.currentGuest', 'guest')
      .leftJoinAndSelect('room.devices', 'devices');

    if (filters?.floor) {
      query.andWhere('room.floor = :floor', { floor: filters.floor });
    }
    if (filters?.status) {
      query.andWhere('room.status = :status', { status: filters.status });
    }
    if (filters?.roomType) {
      query.andWhere('room.roomType = :roomType', { roomType: filters.roomType });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['currentGuest', 'devices', 'scenes'],
    });
    if (!room) {
      throw new NotFoundException('房间不存在');
    }
    return room;
  }

  async findByRoomNumber(roomNumber: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { roomNumber },
      relations: ['currentGuest', 'devices', 'scenes'],
    });
    if (!room) {
      throw new NotFoundException('房间不存在');
    }
    return room;
  }

  async create(data: Partial<Room>): Promise<Room> {
    const room = this.roomRepository.create(data);
    const savedRoom = await this.roomRepository.save(room);
    await this.createDefaultDevices(savedRoom);
    return savedRoom;
  }

  async update(id: string, data: Partial<Room>): Promise<Room> {
    await this.roomRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.roomRepository.delete(id);
  }

  async checkIn(roomId: string, guestData: Partial<User>): Promise<Room> {
    const room = await this.findOne(roomId);
    
    if (room.status !== RoomStatus.VACANT) {
      throw new BadRequestException('房间不可入住');
    }

    let guest = await this.userRepository.findOne({
      where: { idCard: guestData.idCard },
    });

    if (!guest) {
      const username = `guest_${Date.now()}`;
      guest = this.userRepository.create({
        ...guestData,
        username,
        password: await this.hashPassword(guestData.idCard || '123456'),
        role: UserRole.GUEST,
      });
      guest = await this.userRepository.save(guest);
    }

    room.status = RoomStatus.OCCUPIED;
    room.currentGuest = guest;
    room.checkInTime = new Date();
    room.powerEnabled = true;

    const updatedRoom = await this.roomRepository.save(room);
    await this.turnOnRoomDevices(room, guest);
    
    return updatedRoom;
  }

  async checkOut(roomId: string): Promise<Room> {
    const room = await this.findOne(roomId);
    
    if (room.status !== RoomStatus.OCCUPIED) {
      throw new BadRequestException('房间未入住');
    }

    await this.turnOffAllDevices(room);
    
    room.status = RoomStatus.VACANT;
    room.currentGuest = null;
    room.checkOutTime = new Date();
    room.powerEnabled = false;

    return this.roomRepository.save(room);
  }

  private async createDefaultDevices(room: Room): Promise<void> {
    const devices = [
      { name: '主灯', type: DeviceType.LIGHT, powerRating: 60, state: { brightness: 100, color: 'warm' } },
      { name: '床头灯', type: DeviceType.LIGHT, powerRating: 15, state: { brightness: 50, color: 'warm' } },
      { name: '浴室灯', type: DeviceType.LIGHT, powerRating: 30, state: { brightness: 100, color: 'white' } },
      { name: '空调', type: DeviceType.AC, powerRating: 1200, state: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
      { name: '窗帘', type: DeviceType.CURTAIN, powerRating: 50, state: { position: 0 } },
      { name: '电视', type: DeviceType.TV, powerRating: 150, state: { volume: 30, channel: 1, source: 'hdmi1' } },
    ];

    for (const deviceData of devices) {
      const device = this.deviceRepository.create({
        ...deviceData,
        room,
        status: DeviceStatus.OFF,
      });
      await this.deviceRepository.save(device);
    }
  }

  private async turnOnRoomDevices(room: Room, guest: User): Promise<void> {
    const devices = await this.deviceRepository.find({ where: { room: { id: room.id } } });
    
    for (const device of devices) {
      if (device.type === DeviceType.LIGHT && device.name === '主灯') {
        device.status = DeviceStatus.ON;
        device.lastStateChangeTime = new Date();
        await this.deviceRepository.save(device);
        
        const log = this.deviceLogRepository.create({
          device,
          user: guest,
          action: LogAction.TURN_ON,
          oldState: { status: DeviceStatus.OFF },
          newState: { status: DeviceStatus.ON },
          success: true,
        });
        await this.deviceLogRepository.save(log);
      }
      if (device.type === DeviceType.AC) {
        device.status = DeviceStatus.ON;
        device.state = { temperature: 24, mode: 'cool', fanSpeed: 'auto' };
        device.lastStateChangeTime = new Date();
        await this.deviceRepository.save(device);
      }
    }
  }

  private async turnOffAllDevices(room: Room): Promise<void> {
    const devices = await this.deviceRepository.find({ where: { room: { id: room.id } } });
    
    for (const device of devices) {
      if (device.status !== DeviceStatus.OFF) {
        const oldState = { ...device.state, status: device.status };
        device.status = DeviceStatus.OFF;
        device.lastStateChangeTime = new Date();
        await this.deviceRepository.save(device);
        
        const log = this.deviceLogRepository.create({
          device,
          action: LogAction.TURN_OFF,
          oldState,
          newState: { status: DeviceStatus.OFF },
          success: true,
        });
        await this.deviceLogRepository.save(log);
      }
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 10);
  }

  async getRoomDevices(roomId: string): Promise<Device[]> {
    return this.deviceRepository.find({
      where: { room: { id: roomId } },
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async getRoomStatus(roomId: string): Promise<any> {
    const room = await this.findOne(roomId);
    const devices = await this.getRoomDevices(roomId);
    
    const deviceCount = {
      total: devices.length,
      on: devices.filter(d => d.status === DeviceStatus.ON).length,
      off: devices.filter(d => d.status === DeviceStatus.OFF).length,
    };

    const powerUsage = devices
      .filter(d => d.status === DeviceStatus.ON)
      .reduce((sum, d) => sum + d.powerRating, 0);

    return {
      room,
      devices,
      deviceCount,
      currentPowerUsage: powerUsage,
      powerEnabled: room.powerEnabled,
    };
  }
}
