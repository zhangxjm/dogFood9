import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('command')
  async processVoiceCommand(
    @Body() body: { text: string; roomId?: string },
    @Request() req: any,
  ) {
    const roomId = body.roomId || req.user.roomId;
    if (!roomId) {
      return {
        success: false,
        data: null,
        message: '请指定房间ID',
      };
    }
    return {
      success: true,
      data: await this.voiceService.processVoiceCommand(body.text, roomId, req.user.userId),
      message: '语音指令处理完成',
    };
  }

  @Get('commands')
  async getSupportedCommands() {
    return {
      success: true,
      data: await this.voiceService.getSupportedCommands(),
      message: '获取支持的语音指令列表成功',
    };
  }
}
