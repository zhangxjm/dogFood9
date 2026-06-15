import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Room } from '../entities/room.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['rooms'],
    });
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const room = await this.roomRepository.findOne({
      where: { currentGuest: { id: user.id } },
    });

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      roomId: room?.id || null,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        roomId: room?.id || null,
        roomNumber: room?.roomNumber || null,
      },
    };
  }

  async loginGuest(roomNumber: string, idCard: string) {
    const room = await this.roomRepository.findOne({
      where: { roomNumber },
      relations: ['currentGuest'],
    });

    if (!room || !room.currentGuest) {
      throw new UnauthorizedException('房间未入住或不存在');
    }

    if (room.currentGuest.idCard !== idCard) {
      throw new UnauthorizedException('身份证号不匹配');
    }

    const payload = {
      username: room.currentGuest.username,
      sub: room.currentGuest.id,
      role: UserRole.GUEST,
      roomId: room.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: room.currentGuest.id,
        username: room.currentGuest.username,
        name: room.currentGuest.name,
        role: UserRole.GUEST,
        phone: room.currentGuest.phone,
        roomId: room.id,
        roomNumber: room.roomNumber,
      },
    };
  }
}
