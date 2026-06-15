import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceType, DeviceStatus } from '../entities/device.entity';
import { Scene } from '../entities/scene.entity';
import { DeviceService } from '../device/device.service';
import { SceneService } from '../scene/scene.service';
import { DeviceLog, LogAction } from '../entities/device-log.entity';
import { User } from '../entities/user.entity';

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  action: string;
  device?: Device;
  devices?: Device[];
  scene?: Scene;
}

@Injectable()
export class VoiceService {
  private commandPatterns: Array<{ pattern: RegExp; handler: (matches: RegExpMatchArray, roomId: string, userId: string) => Promise<VoiceCommandResult> }> = [];

  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Scene)
    private sceneRepository: Repository<Scene>,
    @InjectRepository(DeviceLog)
    private deviceLogRepository: Repository<DeviceLog>,
    private deviceService: DeviceService,
    private sceneService: SceneService,
  ) {
    this.initializeCommandPatterns();
  }

  private initializeCommandPatterns() {
    this.commandPatterns = [
      {
        pattern: /(打开|开|开启|启动).*(灯|灯光|电灯|主灯|床头灯|浴室灯)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByTypeAndName(roomId, DeviceType.LIGHT, matches[2]);
          return this.controlDevices(devices, 'turn_on', userId, `已打开${matches[2]}`);
        },
      },
      {
        pattern: /(关闭|关|关掉).*(灯|灯光|电灯|主灯|床头灯|浴室灯)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByTypeAndName(roomId, DeviceType.LIGHT, matches[2]);
          return this.controlDevices(devices, 'turn_off', userId, `已关闭${matches[2]}`);
        },
      },
      {
        pattern: /(打开|开|开启|启动).*(空调)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.AC);
          return this.controlDevices(devices, 'turn_on', userId, '已打开空调');
        },
      },
      {
        pattern: /(关闭|关|关掉).*(空调)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.AC);
          return this.controlDevices(devices, 'turn_off', userId, '已关闭空调');
        },
      },
      {
        pattern: /(打开|开|拉开).*(窗帘|窗)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.CURTAIN);
          return this.controlDevices(devices, 'set_state', userId, '已打开窗帘', { position: 0 });
        },
      },
      {
        pattern: /(关闭|关|拉上).*(窗帘|窗)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.CURTAIN);
          return this.controlDevices(devices, 'set_state', userId, '已关闭窗帘', { position: 100 });
        },
      },
      {
        pattern: /(打开|开|开启).*(电视|tv|TV)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.TV);
          return this.controlDevices(devices, 'turn_on', userId, '已打开电视');
        },
      },
      {
        pattern: /(关闭|关|关掉).*(电视|tv|TV)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.TV);
          return this.controlDevices(devices, 'turn_off', userId, '已关闭电视');
        },
      },
      {
        pattern: /空调温度(调高|提高|增加|加).*(\d+)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.AC);
          const device = devices[0];
          const currentTemp = device.state.temperature || 24;
          const newTemp = currentTemp + parseInt(matches[2]);
          return this.controlDevices(devices, 'set_state', userId, `空调温度已调至${newTemp}度`, { temperature: newTemp });
        },
      },
      {
        pattern: /空调温度(调低|降低|减少|减).*(\d+)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.AC);
          const device = devices[0];
          const currentTemp = device.state.temperature || 24;
          const newTemp = currentTemp - parseInt(matches[2]);
          return this.controlDevices(devices, 'set_state', userId, `空调温度已调至${newTemp}度`, { temperature: newTemp });
        },
      },
      {
        pattern: /空调温度设为|调到|调整到|设置为.*(\d+)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.AC);
          const temp = parseInt(matches[1]);
          return this.controlDevices(devices, 'set_state', userId, `空调温度已设为${temp}度`, { temperature: temp });
        },
      },
      {
        pattern: /(亮度|灯|灯光).*(亮|暗|亮一点|暗一点|调高|调低|增加|减少).*(\d+)/,
        handler: async (matches, roomId, userId) => {
          const devices = await this.getDevicesByType(roomId, DeviceType.LIGHT);
          const device = devices.find(d => d.status === DeviceStatus.ON) || devices[0];
          const currentBrightness = device.state.brightness || 50;
          const isIncrease = matches[2].includes('亮') || matches[2].includes('增') || matches[2].includes('调高');
          const change = parseInt(matches[3]);
          const newBrightness = isIncrease 
            ? Math.min(100, currentBrightness + change)
            : Math.max(0, currentBrightness - change);
          return this.controlDevices([device], 'set_state', userId, `灯光亮度已调至${newBrightness}%`, { brightness: newBrightness });
        },
      },
      {
        pattern: /(睡眠|睡觉|休息)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '睡眠模式', userId);
        },
      },
      {
        pattern: /(阅读|看书|读书)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '阅读模式', userId);
        },
      },
      {
        pattern: /(观影|看电影|看电视|看剧)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '观影模式', userId);
        },
      },
      {
        pattern: /(离开|出门|外出)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '离开模式', userId);
        },
      },
      {
        pattern: /(回家|回来|到家)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '回家模式', userId);
        },
      },
      {
        pattern: /(浪漫|约会|惊喜)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '浪漫模式', userId);
        },
      },
      {
        pattern: /(全部关闭|全关|全部关掉|关闭所有|关掉所有)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '离开模式', userId);
        },
      },
      {
        pattern: /(全部打开|全开|打开所有|开启所有)/,
        handler: async (matches, roomId, userId) => {
          return this.activateSceneByName(roomId, '回家模式', userId);
        },
      },
    ];
  }

  private async getDevicesByType(roomId: string, type: DeviceType): Promise<Device[]> {
    return this.deviceRepository.find({
      where: { room: { id: roomId }, type },
    });
  }

  private async getDevicesByTypeAndName(roomId: string, type: DeviceType, nameKeyword: string): Promise<Device[]> {
    const devices = await this.getDevicesByType(roomId, type);
    const matchedDevices = devices.filter(d => 
      d.name.includes(nameKeyword) || nameKeyword.includes(d.type) || nameKeyword === '灯' || nameKeyword === '灯光'
    );
    return matchedDevices.length > 0 ? matchedDevices : devices;
  }

  private async controlDevices(
    devices: Device[],
    action: string,
    userId: string,
    successMessage: string,
    params?: any,
  ): Promise<VoiceCommandResult> {
    if (devices.length === 0) {
      return {
        success: false,
        message: '未找到相关设备',
        action,
      };
    }

    const results: Device[] = [];
    for (const device of devices) {
      try {
        const startTime = Date.now();
        const oldState = { ...device.state, status: device.status };
        
        let result: Device;
        if (action === 'turn_on') {
          result = await this.deviceService.turnOn(device.id, userId);
        } else if (action === 'turn_off') {
          result = await this.deviceService.turnOff(device.id, userId);
        } else if (action === 'set_state') {
          result = await this.deviceService.setDeviceState(device.id, params, userId);
        } else {
          result = device;
        }
        
        results.push(result);
        
        const log = this.deviceLogRepository.create({
          device,
          user: { id: userId } as User,
          action: LogAction.VOICE_CONTROL,
          oldState,
          newState: { ...result.state, status: result.status },
          success: true,
          responseTime: Date.now() - startTime,
        });
        await this.deviceLogRepository.save(log);
      } catch (error) {
        console.error(`Voice control error for device ${device.id}:`, error);
      }
    }

    return {
      success: results.length > 0,
      message: results.length > 0 ? successMessage : '设备控制失败',
      action,
      devices: results,
    };
  }

  private async activateSceneByName(roomId: string, sceneName: string, userId: string): Promise<VoiceCommandResult> {
    const scenes = await this.sceneRepository.find({
      where: [
        { room: { id: roomId } },
        { isGlobal: true },
      ],
    });

    const scene = scenes.find(s => s.name === sceneName);
    if (!scene) {
      return {
        success: false,
        message: `未找到${sceneName}`,
        action: 'activate_scene',
      };
    }

    const devices = await this.sceneService.activateSceneForRoom(scene.id, roomId, userId);

    return {
      success: true,
      message: `已切换到${sceneName}`,
      action: 'activate_scene',
      scene,
      devices,
    };
  }

  async processVoiceCommand(text: string, roomId: string, userId?: string): Promise<VoiceCommandResult> {
    const normalizedText = text.toLowerCase().trim();
    
    for (const { pattern, handler } of this.commandPatterns) {
      const matches = normalizedText.match(pattern);
      if (matches) {
        return handler(matches, roomId, userId);
      }
    }

    return {
      success: false,
      message: '未识别的语音指令，请重试',
      action: 'unknown',
    };
  }

  async getSupportedCommands(): Promise<string[]> {
    return [
      '打开/关闭灯光',
      '打开/关闭空调',
      '打开/关闭窗帘',
      '打开/关闭电视',
      '空调温度调高/调低X度',
      '空调温度设为X度',
      '灯光亮度调高/调低X%',
      '睡眠模式',
      '阅读模式',
      '观影模式',
      '离开模式',
      '回家模式',
      '浪漫模式',
      '全部关闭',
      '全部打开',
    ];
  }
}
