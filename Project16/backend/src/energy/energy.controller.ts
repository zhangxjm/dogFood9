import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/energy')
@UseGuards(JwtAuthGuard)
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get('my-consumption')
  async getMyConsumption(
    @Request() req: any,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ) {
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

    return {
      success: true,
      data: await this.energyService.getUserConsumption(req.user.userId, startDate, now),
      message: '获取能耗统计成功',
    };
  }

  @Get('room/:roomId')
  async getRoomConsumption(
    @Param('roomId') roomId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    let startDate: Date;
    let endDate: Date;

    if (period) {
      return {
        success: true,
        data: await this.energyService.getEnergyStatistics(roomId, period),
        message: '获取房间能耗统计成功',
      };
    }

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      success: true,
      data: await this.energyService.getRoomConsumption(roomId, startDate, endDate),
      message: '获取房间能耗统计成功',
    };
  }

  @Get('room/:roomId/current')
  async getCurrentPowerUsage(@Param('roomId') roomId: string) {
    return {
      success: true,
      data: await this.energyService.getCurrentPowerUsage(roomId),
      message: '获取当前用电情况成功',
    };
  }

  @Get('hotel')
  async getHotelConsumption(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    let startDate: Date;
    let endDate: Date;

    if (period) {
      return {
        success: true,
        data: await this.energyService.getEnergyStatistics(undefined, period),
        message: '获取酒店能耗统计成功',
      };
    }

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      success: true,
      data: await this.energyService.getHotelConsumption(startDate, endDate),
      message: '获取酒店能耗统计成功',
    };
  }

  @Get('statistics')
  async getEnergyStatistics(
    @Query('roomId') roomId?: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ) {
    return {
      success: true,
      data: await this.energyService.getEnergyStatistics(roomId, period),
      message: '获取能耗统计数据成功',
    };
  }

  @Get('room/:roomId/report')
  async generateEnergyReport(
    @Param('roomId') roomId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr 
      ? new Date(startDateStr) 
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      success: true,
      data: await this.energyService.generateEnergyReport(roomId, startDate, endDate),
      message: '生成能耗报告成功',
    };
  }

  @Post('calculate')
  async triggerCalculation() {
    await this.energyService['calculateHourlyConsumption']();
    return {
      success: true,
      message: '能耗计算已触发',
    };
  }
}
