import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeviceService } from '../device/device.service';
import { RoomService } from '../room/room.service';
import { Device, DeviceStatus } from '../entities/device.entity';
import { SceneService } from '../scene/scene.service';
import { VoiceService } from '../voice/voice.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    username: string;
    role: string;
    roomId: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class DeviceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, AuthenticatedSocket> = new Map();
  private roomSubscriptions: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private deviceService: DeviceService,
    private roomService: RoomService,
    private sceneService: SceneService,
    private voiceService: VoiceService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (token) {
        const decoded = this.jwtService.verify(token);
        client.user = {
          userId: decoded.sub,
          username: decoded.username,
          role: decoded.role,
          roomId: decoded.roomId,
        };
        
        this.connectedClients.set(client.id, client);
        
        if (client.user.roomId) {
          client.join(`room:${client.user.roomId}`);
          this.addRoomSubscription(client.user.roomId, client.id);
        }
        
        console.log(`Client connected: ${client.id}, user: ${client.user.username}`);
        
        client.emit('connected', {
          success: true,
          message: '已连接到设备控制服务',
          user: client.user,
        });
      } else {
        client.emit('error', { message: '未提供认证令牌' });
        client.disconnect();
      }
    } catch (error) {
      client.emit('error', { message: '认证失败: ' + error.message });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    
    if (client.user?.roomId) {
      this.removeRoomSubscription(client.user.roomId, client.id);
    }
    
    console.log(`Client disconnected: ${client.id}`);
  }

  private addRoomSubscription(roomId: string, clientId: string) {
    if (!this.roomSubscriptions.has(roomId)) {
      this.roomSubscriptions.set(roomId, new Set());
    }
    this.roomSubscriptions.get(roomId)!.add(clientId);
  }

  private removeRoomSubscription(roomId: string, clientId: string) {
    if (this.roomSubscriptions.has(roomId)) {
      this.roomSubscriptions.get(roomId)!.delete(clientId);
    }
  }

  broadcastDeviceState(device: Device) {
    const roomId = device.room?.id;
    if (roomId) {
      this.server.to(`room:${roomId}`).emit('device_state_changed', {
        type: 'device_state',
        timestamp: new Date().toISOString(),
        data: device,
      });
    }
    
    this.server.emit('device_update', {
      type: 'device_update',
      timestamp: new Date().toISOString(),
      data: device,
    });
  }

  broadcastRoomStatus(roomId: string, status: any) {
    this.server.to(`room:${roomId}`).emit('room_status_changed', {
      type: 'room_status',
      timestamp: new Date().toISOString(),
      data: status,
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    return {
      event: 'pong',
      data: {
        timestamp: new Date().toISOString(),
        echo: data,
      },
    };
  }

  @SubscribeMessage('get_device_list')
  async handleGetDeviceList(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const roomId = data?.roomId || client.user?.roomId;
      if (!roomId) {
        return { event: 'error', data: { message: '未指定房间ID' } };
      }

      const devices = await this.deviceService.findAll({ roomId });
      return {
        event: 'device_list',
        data: {
          roomId,
          devices,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('get_room_status')
  async handleGetRoomStatus(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const roomId = data?.roomId || client.user?.roomId;
      if (!roomId) {
        return { event: 'error', data: { message: '未指定房间ID' } };
      }

      const status = await this.roomService.getRoomStatus(roomId);
      return {
        event: 'room_status',
        data: {
          roomId,
          ...status,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('control_device')
  async handleControlDevice(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const { deviceId, action, params } = data;
      const userId = client.user?.userId;

      const startTime = Date.now();
      const device = await this.deviceService.controlDevice(deviceId, action, params, userId);
      const responseTime = Date.now() - startTime;

      this.broadcastDeviceState(device);

      return {
        event: 'device_control_result',
        data: {
          success: true,
          deviceId,
          action,
          device,
          responseTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'device_control_result',
        data: {
          success: false,
          deviceId: data?.deviceId,
          action: data?.action,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  @SubscribeMessage('turn_on_device')
  async handleTurnOnDevice(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const { deviceId } = data;
      const userId = client.user?.userId;

      const device = await this.deviceService.turnOn(deviceId, userId);
      this.broadcastDeviceState(device);

      return {
        event: 'device_state',
        data: {
          success: true,
          device,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('turn_off_device')
  async handleTurnOffDevice(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const { deviceId } = data;
      const userId = client.user?.userId;

      const device = await this.deviceService.turnOff(deviceId, userId);
      this.broadcastDeviceState(device);

      return {
        event: 'device_state',
        data: {
          success: true,
          device,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('toggle_device')
  async handleToggleDevice(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const { deviceId } = data;
      const userId = client.user?.userId;

      const device = await this.deviceService.toggle(deviceId, userId);
      this.broadcastDeviceState(device);

      return {
        event: 'device_state',
        data: {
          success: true,
          device,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('set_device_state')
  async handleSetDeviceState(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const { deviceId, state } = data;
      const userId = client.user?.userId;

      const device = await this.deviceService.setDeviceState(deviceId, state, userId);
      this.broadcastDeviceState(device);

      return {
        event: 'device_state',
        data: {
          success: true,
          device,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('activate_scene')
  async handleActivateScene(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const { sceneId, roomId } = data;
      const userId = client.user?.userId;
      const targetRoomId = roomId || client.user?.roomId;

      const devices = await this.sceneService.activateSceneForRoom(sceneId, targetRoomId, userId);

      for (const device of devices) {
        this.broadcastDeviceState(device);
      }

      return {
        event: 'scene_activated',
        data: {
          success: true,
          sceneId,
          roomId: targetRoomId,
          devices,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('voice_command')
  async handleVoiceCommand(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const { text, roomId } = data;
      const userId = client.user?.userId;
      const targetRoomId = roomId || client.user?.roomId;

      if (!targetRoomId) {
        return { event: 'error', data: { message: '未指定房间ID' } };
      }

      const result = await this.voiceService.processVoiceCommand(text, targetRoomId, userId);

      if (result.devices) {
        for (const device of result.devices) {
          this.broadcastDeviceState(device);
        }
      }

      return {
        event: 'voice_command_result',
        data: {
          ...result,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('get_scene_list')
  async handleGetSceneList(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const roomId = data?.roomId || client.user?.roomId;
      const scenes = await this.sceneService.findAll(roomId);

      return {
        event: 'scene_list',
        data: {
          roomId,
          scenes,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('get_current_power')
  async handleGetCurrentPower(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    try {
      const roomId = data?.roomId || client.user?.roomId;
      if (!roomId) {
        return { event: 'error', data: { message: '未指定房间ID' } };
      }

      const powerUsage = await this.deviceService.findAll({ roomId });
      const activeDevices = powerUsage.filter(d => d.status === DeviceStatus.ON);
      const totalPower = activeDevices.reduce((sum, d) => sum + d.powerRating, 0);

      return {
        event: 'current_power',
        data: {
          roomId,
          totalPower,
          activeDeviceCount: activeDevices.length,
          totalDeviceCount: powerUsage.length,
          activeDevices,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('subscribe_room')
  handleSubscribeRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    const { roomId } = data;
    client.join(`room:${roomId}`);
    this.addRoomSubscription(roomId, client.id);
    
    return {
      event: 'subscribed',
      data: {
        roomId,
        message: `已订阅房间 ${roomId} 的状态更新`,
      },
    };
  }

  @SubscribeMessage('unsubscribe_room')
  handleUnsubscribeRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    const { roomId } = data;
    client.leave(`room:${roomId}`);
    this.removeRoomSubscription(roomId, client.id);
    
    return {
      event: 'unsubscribed',
      data: {
        roomId,
        message: `已取消订阅房间 ${roomId} 的状态更新`,
      },
    };
  }
}
