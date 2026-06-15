import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { EnergyConsumption, ConsumptionType } from '../entities/energy-consumption.entity';
import { Room, RoomStatus } from '../entities/room.entity';
import { Device, DeviceStatus, DeviceType } from '../entities/device.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

const ELECTRICITY_RATE = 0.8;

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(EnergyConsumption)
    private energyRepository: Repository<EnergyConsumption>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async calculateHourlyConsumption() {
    const rooms = await this.roomRepository.find({
      where: { status: RoomStatus.OCCUPIED },
      relations: ['devices', 'currentGuest'],
    });

    for (const room of rooms) {
      const activeDevices = room.devices.filter(d => d.status === DeviceStatus.ON);
      const totalPower = activeDevices.reduce((sum, d) => sum + d.powerRating, 0);
      const consumption = (totalPower / 1000) * 1;

      if (consumption > 0) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const energyRecord = this.energyRepository.create({
          room,
          user: room.currentGuest,
          type: ConsumptionType.ELECTRICITY,
          consumption,
          cost: consumption * ELECTRICITY_RATE,
          startTime: oneHourAgo,
          endTime: now,
        });
        await this.energyRepository.save(energyRecord);
      }
    }
  }

  async getRoomConsumption(roomId: string, startDate: Date, endDate: Date): Promise<any> {
    const consumptions = await this.energyRepository.find({
      where: {
        room: { id: roomId },
        startTime: Between(startDate, endDate),
      },
      order: { startTime: 'ASC' },
    });

    const totalConsumption = consumptions.reduce((sum, c) => sum + c.consumption, 0);
    const totalCost = consumptions.reduce((sum, c) => sum + c.cost, 0);

    const byDevice = await this.getConsumptionByDevice(roomId, startDate, endDate);
    const hourlyData = this.aggregateHourlyData(consumptions);
    const dailyData = this.aggregateDailyData(consumptions);

    return {
      totalConsumption,
      totalCost,
      count: consumptions.length,
      byDevice,
      hourlyData,
      dailyData,
      records: consumptions,
    };
  }

  async getUserConsumption(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const consumptions = await this.energyRepository.find({
      where: {
        user: { id: userId },
        startTime: Between(startDate, endDate),
      },
      relations: ['room'],
      order: { startTime: 'ASC' },
    });

    const totalConsumption = consumptions.reduce((sum, c) => sum + c.consumption, 0);
    const totalCost = consumptions.reduce((sum, c) => sum + c.cost, 0);

    const byRoom = this.aggregateByRoom(consumptions);
    const dailyData = this.aggregateDailyData(consumptions);

    return {
      totalConsumption,
      totalCost,
      count: consumptions.length,
      byRoom,
      dailyData,
      records: consumptions,
    };
  }

  async getHotelConsumption(startDate: Date, endDate: Date): Promise<any> {
    const consumptions = await this.energyRepository.find({
      where: {
        startTime: Between(startDate, endDate),
      },
      relations: ['room'],
      order: { startTime: 'ASC' },
    });

    const totalConsumption = consumptions.reduce((sum, c) => sum + c.consumption, 0);
    const totalCost = consumptions.reduce((sum, c) => sum + c.cost, 0);

    const byRoom = this.aggregateByRoom(consumptions);
    const dailyData = this.aggregateDailyData(consumptions);

    return {
      totalConsumption,
      totalCost,
      count: consumptions.length,
      byRoom,
      dailyData,
      records: consumptions,
    };
  }

  async getConsumptionByDevice(roomId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const devices = await this.deviceRepository.find({
      where: { room: { id: roomId } },
    });

    const result = [];
    for (const device of devices) {
      const estimatedConsumption = await this.estimateDeviceConsumption(device, startDate, endDate);
      result.push({
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.type,
        powerRating: device.powerRating,
        estimatedConsumption,
        estimatedCost: estimatedConsumption * ELECTRICITY_RATE,
      });
    }

    return result.sort((a, b) => b.estimatedConsumption - a.estimatedConsumption);
  }

  private async estimateDeviceConsumption(device: Device, startDate: Date, endDate: Date): Promise<number> {
    const logs = await this.energyRepository.find({
      where: {
        device: { id: device.id },
        startTime: Between(startDate, endDate),
      },
    });

    if (logs.length > 0) {
      return logs.reduce((sum, l) => sum + l.consumption, 0);
    }

    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const estimatedHours = device.status === DeviceStatus.ON ? hours * 0.7 : hours * 0.1;
    return (device.powerRating / 1000) * estimatedHours;
  }

  private aggregateHourlyData(consumptions: EnergyConsumption[]): any[] {
    const hourlyMap = new Map<string, { consumption: number; cost: number }>();

    for (const c of consumptions) {
      const hourKey = c.startTime.toISOString().slice(0, 13);
      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { consumption: 0, cost: 0 });
      }
      const data = hourlyMap.get(hourKey)!;
      data.consumption += c.consumption;
      data.cost += c.cost;
    }

    return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      ...data,
    })).sort((a, b) => a.hour.localeCompare(b.hour));
  }

  private aggregateDailyData(consumptions: EnergyConsumption[]): any[] {
    const dailyMap = new Map<string, { consumption: number; cost: number }>();

    for (const c of consumptions) {
      const dayKey = c.startTime.toISOString().slice(0, 10);
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { consumption: 0, cost: 0 });
      }
      const data = dailyMap.get(dayKey)!;
      data.consumption += c.consumption;
      data.cost += c.cost;
    }

    return Array.from(dailyMap.entries()).map(([day, data]) => ({
      day,
      ...data,
    })).sort((a, b) => a.day.localeCompare(b.day));
  }

  private aggregateByRoom(consumptions: EnergyConsumption[]): any[] {
    const roomMap = new Map<string, { roomNumber: string; consumption: number; cost: number }>();

    for (const c of consumptions) {
      if (!c.room) continue;
      const roomId = c.room.id;
      if (!roomMap.has(roomId)) {
        roomMap.set(roomId, { roomNumber: c.room.roomNumber, consumption: 0, cost: 0 });
      }
      const data = roomMap.get(roomId)!;
      data.consumption += c.consumption;
      data.cost += c.cost;
    }

    return Array.from(roomMap.entries()).map(([roomId, data]) => ({
      roomId,
      ...data,
    })).sort((a, b) => b.consumption - a.consumption);
  }

  async getCurrentPowerUsage(roomId: string): Promise<any> {
    const devices = await this.deviceRepository.find({
      where: { room: { id: roomId } },
    });

    const activeDevices = devices.filter(d => d.status === DeviceStatus.ON);
    const totalPower = activeDevices.reduce((sum, d) => sum + d.powerRating, 0);

    const byType = {};
    for (const type of Object.values(DeviceType)) {
      const typeDevices = activeDevices.filter(d => d.type === type);
      byType[type] = {
        count: typeDevices.length,
        power: typeDevices.reduce((sum, d) => sum + d.powerRating, 0),
      };
    }

    return {
      totalPower,
      activeDeviceCount: activeDevices.length,
      totalDeviceCount: devices.length,
      estimatedHourlyConsumption: totalPower / 1000,
      estimatedHourlyCost: (totalPower / 1000) * ELECTRICITY_RATE,
      byType,
      activeDevices: activeDevices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        powerRating: d.powerRating,
      })),
    };
  }

  async getEnergyStatistics(roomId?: string, period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const data = roomId
      ? await this.getRoomConsumption(roomId, startDate, now)
      : await this.getHotelConsumption(startDate, now);

    return {
      period,
      startDate,
      endDate: now,
      ...data,
      electricityRate: ELECTRICITY_RATE,
    };
  }

  async generateEnergyReport(roomId: string, startDate: Date, endDate: Date): Promise<any> {
    const consumption = await this.getRoomConsumption(roomId, startDate, endDate);
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    const currentPower = await this.getCurrentPowerUsage(roomId);

    const peakHour = this.findPeakHour(consumption.hourlyData);
    const recommendations = this.generateRecommendations(consumption, currentPower);

    return {
      roomNumber: room?.roomNumber,
      period: { startDate, endDate },
      summary: {
        totalConsumption: consumption.totalConsumption,
        totalCost: consumption.totalCost,
        averageDailyConsumption: consumption.totalConsumption / Math.max(1, consumption.dailyData.length),
        peakHour,
      },
      breakdown: {
        byDevice: consumption.byDevice,
        byHour: consumption.hourlyData,
        byDay: consumption.dailyData,
      },
      currentUsage: currentPower,
      recommendations,
    };
  }

  private findPeakHour(hourlyData: any[]): string | null {
    if (hourlyData.length === 0) return null;
    const peak = hourlyData.reduce((max, current) => 
      current.consumption > max.consumption ? current : max
    );
    return peak.hour;
  }

  private generateRecommendations(consumption: any, currentPower: any): string[] {
    const recommendations: string[] = [];

    if (currentPower.totalPower > 2000) {
      recommendations.push('当前用电功率较高，建议关闭部分不使用的设备以节约能源');
    }

    const acConsumption = consumption.byDevice?.find((d: any) => d.deviceType === 'ac');
    if (acConsumption && acConsumption.estimatedConsumption > consumption.totalConsumption * 0.5) {
      recommendations.push('空调能耗占比较高，建议适当提高空调温度或减少使用时间');
    }

    const lightConsumption = consumption.byDevice?.filter((d: any) => d.deviceType === 'light')
      .reduce((sum: number, d: any) => sum + d.estimatedConsumption, 0);
    if (lightConsumption > consumption.totalConsumption * 0.3) {
      recommendations.push('照明能耗较高，建议在光线充足时关闭灯光，使用自然光源');
    }

    if (consumption.totalConsumption > 50) {
      recommendations.push('本周能耗较高，建议养成随手关灯的习惯，合理使用电器');
    }

    if (recommendations.length === 0) {
      recommendations.push('您的用电习惯良好，继续保持！');
    }

    return recommendations;
  }
}
