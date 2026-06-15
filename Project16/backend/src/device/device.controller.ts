import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { DeviceService } from './device.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeviceStatus, DeviceType } from '../entities/device.entity';

@Controller('api/devices')
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  async findAll(
    @Query('roomId') roomId?: string,
    @Query('type') type?: DeviceType,
    @Query('status') status?: DeviceStatus,
  ) {
    return {
      success: true,
      data: await this.deviceService.findAll({ roomId, type, status }),
      message: '获取设备列表成功',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      success: true,
      data: await this.deviceService.findOne(id),
      message: '获取设备信息成功',
    };
  }

  @Get(':id/status')
  async getDeviceStatus(@Param('id') id: string) {
    return {
      success: true,
      data: await this.deviceService.getDeviceStatus(id),
      message: '获取设备状态成功',
    };
  }

  @Get(':id/logs')
  async getDeviceLogs(@Param('id') id: string, @Query('limit') limit: number = 50) {
    return {
      success: true,
      data: await this.deviceService.getDeviceLogs(id, limit),
      message: '获取设备操作日志成功',
    };
  }

  @Post()
  async create(@Body() body: any) {
    return {
      success: true,
      data: await this.deviceService.create(body),
      message: '创建设备成功',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return {
      success: true,
      data: await this.deviceService.update(id, body),
      message: '更新设备信息成功',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.deviceService.remove(id);
    return {
      success: true,
      data: null,
      message: '删除设备成功',
    };
  }

  @Post(':id/turn-on')
  async turnOn(@Param('id') id: string, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.turnOn(id, req.user.userId),
      message: '设备已开启',
    };
  }

  @Post(':id/turn-off')
  async turnOff(@Param('id') id: string, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.turnOff(id, req.user.userId),
      message: '设备已关闭',
    };
  }

  @Post(':id/toggle')
  async toggle(@Param('id') id: string, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.toggle(id, req.user.userId),
      message: '设备状态已切换',
    };
  }

  @Post(':id/set-state')
  async setDeviceState(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.setDeviceState(id, body, req.user.userId),
      message: '设备状态已更新',
    };
  }

  @Post(':id/control')
  async controlDevice(@Param('id') id: string, @Body() body: { action: string; params?: any }, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.controlDevice(id, body.action, body.params, req.user.userId),
      message: '设备控制成功',
    };
  }

  @Post(':id/light')
  async controlLight(@Param('id') id: string, @Body() body: { action: string; params?: any }, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.controlLight(id, body.action, body.params, req.user.userId),
      message: '灯光控制成功',
    };
  }

  @Post(':id/ac')
  async controlAC(@Param('id') id: string, @Body() body: { action: string; params?: any }, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.controlAC(id, body.action, body.params, req.user.userId),
      message: '空调控制成功',
    };
  }

  @Post(':id/curtain')
  async controlCurtain(@Param('id') id: string, @Body() body: { action: string; params?: any }, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.controlCurtain(id, body.action, body.params, req.user.userId),
      message: '窗帘控制成功',
    };
  }

  @Post(':id/tv')
  async controlTV(@Param('id') id: string, @Body() body: { action: string; params?: any }, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.controlTV(id, body.action, body.params, req.user.userId),
      message: '电视控制成功',
    };
  }

  @Post('batch-control')
  async batchControl(@Body() body: { deviceStates: Array<{ deviceId: string; state: any }> }, @Request() req: any) {
    return {
      success: true,
      data: await this.deviceService.executeScene(body.deviceStates, req.user.userId),
      message: '批量控制成功',
    };
  }
}
