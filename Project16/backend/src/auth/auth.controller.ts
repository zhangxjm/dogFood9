import { Controller, Post, Request, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return {
      success: true,
      data: await this.authService.login(req.user),
      message: '登录成功',
    };
  }

  @Post('guest-login')
  async guestLogin(@Body() body: { roomNumber: string; idCard: string }) {
    return {
      success: true,
      data: await this.authService.loginGuest(body.roomNumber, body.idCard),
      message: '登录成功',
    };
  }
}
