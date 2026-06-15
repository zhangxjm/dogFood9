import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { SceneService } from './scene.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/scenes')
@UseGuards(JwtAuthGuard)
export class SceneController {
  constructor(private readonly sceneService: SceneService) {}

  @Get()
  async findAll(@Query('roomId') roomId?: string) {
    return {
      success: true,
      data: await this.sceneService.findAll(roomId),
      message: '获取场景列表成功',
    };
  }

  @Get('room/:roomId')
  async getRoomScenes(@Param('roomId') roomId: string) {
    return {
      success: true,
      data: await this.sceneService.getRoomScenes(roomId),
      message: '获取房间场景列表成功',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      success: true,
      data: await this.sceneService.findOne(id),
      message: '获取场景信息成功',
    };
  }

  @Post()
  async create(@Body() body: any) {
    return {
      success: true,
      data: await this.sceneService.create(body),
      message: '创建场景成功',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return {
      success: true,
      data: await this.sceneService.update(id, body),
      message: '更新场景成功',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.sceneService.remove(id);
    return {
      success: true,
      data: null,
      message: '删除场景成功',
    };
  }

  @Post(':id/activate')
  async activateScene(@Param('id') id: string, @Request() req: any) {
    return {
      success: true,
      data: await this.sceneService.activateScene(id, req.user.userId),
      message: '场景激活成功',
    };
  }

  @Post(':id/activate/room/:roomId')
  async activateSceneForRoom(
    @Param('id') id: string,
    @Param('roomId') roomId: string,
    @Request() req: any,
  ) {
    return {
      success: true,
      data: await this.sceneService.activateSceneForRoom(id, roomId, req.user.userId),
      message: '场景激活成功',
    };
  }

  @Post('room/:roomId/default')
  async createDefaultScenes(@Param('roomId') roomId: string) {
    return {
      success: true,
      data: await this.sceneService.createDefaultScenes(roomId),
      message: '创建默认场景成功',
    };
  }
}
