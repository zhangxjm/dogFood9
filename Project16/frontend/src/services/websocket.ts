import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = 'ws://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<Socket> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = await AsyncStorage.getItem('auth_token');
    
    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', { success: true });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.onAny((event, data) => {
      this.notifyListeners(event, data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      });
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => {
        try {
          callback({ event, data });
        } catch (error) {
          console.error(`Error in wildcard listener:`, error);
        }
      });
    }
  }

  emit(event: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        if (response?.event === 'error') {
          reject(new Error(response.data?.message || 'Unknown error'));
        } else {
          resolve(response);
        }
      });
    });
  }

  async getDeviceList(roomId?: string): Promise<any> {
    return this.emit('get_device_list', { roomId });
  }

  async getRoomStatus(roomId?: string): Promise<any> {
    return this.emit('get_room_status', { roomId });
  }

  async controlDevice(deviceId: string, action: string, params?: any): Promise<any> {
    return this.emit('control_device', { deviceId, action, params });
  }

  async turnOnDevice(deviceId: string): Promise<any> {
    return this.emit('turn_on_device', { deviceId });
  }

  async turnOffDevice(deviceId: string): Promise<any> {
    return this.emit('turn_off_device', { deviceId });
  }

  async toggleDevice(deviceId: string): Promise<any> {
    return this.emit('toggle_device', { deviceId });
  }

  async setDeviceState(deviceId: string, state: Record<string, any>): Promise<any> {
    return this.emit('set_device_state', { deviceId, state });
  }

  async activateScene(sceneId: string, roomId?: string): Promise<any> {
    return this.emit('activate_scene', { sceneId, roomId });
  }

  async sendVoiceCommand(text: string, roomId?: string): Promise<any> {
    return this.emit('voice_command', { text, roomId });
  }

  async getSceneList(roomId?: string): Promise<any> {
    return this.emit('get_scene_list', { roomId });
  }

  async getCurrentPower(roomId?: string): Promise<any> {
    return this.emit('get_current_power', { roomId });
  }

  async subscribeRoom(roomId: string): Promise<any> {
    return this.emit('subscribe_room', { roomId });
  }

  async unsubscribeRoom(roomId: string): Promise<any> {
    return this.emit('unsubscribe_room', { roomId });
  }
}

export const wsService = new WebSocketService();
export default wsService;
