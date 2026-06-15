import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { RoomService } from './room.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomStatus } from '../entities/room.entity';

@Controller('api/rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async findAll(
    @Query('floor') floor?: number,
    @Query('status') status?: RoomStatus,
    @Query('roomType') roomType?: string,
  ) {
    return {
      success: true,
      data: await this.roomService.findAll({ floor, status, roomType }),
      message: '获取房间列表成功',
    };
  }

  @Get('my-room')
  async getMyRoom(@Request() req: any) {
    if (!req.user.roomId) {
      return {
        success: false,
        data: null,
        message: '当前用户没有入住房间',
      };
    }
    return {
      success: true,
      data: await this.roomService.findOne(req.user.roomId),
      message: '获取房间信息成功',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      success: true,
      data: await this.roomService.findOne(id),
      message: '获取房间信息成功',
    };
  }

  @Get('number/:roomNumber')
  async findByRoomNumber(@Param('roomNumber') roomNumber: string) {
    return {
      success: true,
      data: await this.roomService.findByRoomNumber(roomNumber),
      message: '获取房间信息成功',
    };
  }

  @Get(':id/status')
  async getRoomStatus(@Param('id') id: string) {
    return {
      success: true,
      data: await this.roomService.getRoomStatus(id),
      message: '获取房间状态成功',
    };
  }

  @Get(':id/devices')
  async getRoomDevices(@Param('id') id: string) {
    return {
      success: true,
      data: await this.roomService.getRoomDevices(id),
      message: '获取房间设备列表成功',
    };
  }

  @Post()
  async create(@Body() body: any) {
    return {
      success: true,
      data: await this.roomService.create(body),
      message: '创建房间成功',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return {
      success: true,
      data: await this.roomService.update(id, body),
      message: '更新房间信息成功',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.roomService.remove(id);
    return {
      success: true,
      data: null,
      message: '删除房间成功',
    };
  }

  @Post(':id/check-in')
  async checkIn(@Param('id') id: string, @Body() body: any) {
    return {
      success: true,
      data: await this.roomService.checkIn(id, body),
      message: '入住成功，房间已通电',
    };
  }

  @Post(':id/check-out')
  async checkOut(@Param('id') id: string) {
    return {
      success: true,
      data: await this.roomService.checkOut(id),
      message: '退房成功，房间已断电',
    };
  }
}
