import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  phone: string;
  roomId: string | null;
  roomNumber: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Device {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'curtain' | 'tv';
  status: 'on' | 'off' | 'standby';
  state: Record<string, any>;
  powerRating: number;
  isOnline: boolean;
  lastCommandTime: string | null;
  lastStateChangeTime: string | null;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  pricePerNight: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  powerEnabled: boolean;
  currentGuest: User | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  devices: Device[];
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  deviceStates: Record<string, any>;
  isGlobal: boolean;
  icon: string | null;
}

export interface EnergyData {
  totalConsumption: number;
  totalCost: number;
  count: number;
  dailyData: Array<{ day: string; consumption: number; cost: number }>;
  byDevice: Array<{
    deviceId: string;
    deviceName: string;
    deviceType: string;
    estimatedConsumption: number;
    estimatedCost: number;
  }>;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ success: boolean; data: AuthResponse; message: string }>('/auth/login', {
      username,
      password,
    }),
  
  guestLogin: (roomNumber: string, idCard: string) =>
    api.post<{ success: boolean; data: AuthResponse; message: string }>('/auth/guest-login', {
      roomNumber,
      idCard,
    }),
};

export const roomApi = {
  getRooms: (filters?: { floor?: number; status?: string }) =>
    api.get<{ success: boolean; data: Room[]; message: string }>('/rooms', { params: filters }),
  
  getRoom: (id: string) =>
    api.get<{ success: boolean; data: Room; message: string }>(`/rooms/${id}`),
  
  getMyRoom: () =>
    api.get<{ success: boolean; data: Room; message: string }>('/rooms/my-room'),
  
  getRoomStatus: (id: string) =>
    api.get<{ success: boolean; data: any; message: string }>(`/rooms/${id}/status`),
  
  getRoomDevices: (id: string) =>
    api.get<{ success: boolean; data: Device[]; message: string }>(`/rooms/${id}/devices`),
  
  checkIn: (roomId: string, guestData: any) =>
    api.post(`/rooms/${roomId}/check-in`, guestData),
  
  checkOut: (roomId: string) =>
    api.post(`/rooms/${roomId}/check-out`),
};

export const deviceApi = {
  getDevices: (filters?: { roomId?: string; type?: string; status?: string }) =>
    api.get<{ success: boolean; data: Device[]; message: string }>('/devices', { params: filters }),
  
  getDevice: (id: string) =>
    api.get<{ success: boolean; data: Device; message: string }>(`/devices/${id}`),
  
  turnOn: (id: string) =>
    api.post<{ success: boolean; data: Device; message: string }>(`/devices/${id}/turn-on`),
  
  turnOff: (id: string) =>
    api.post<{ success: boolean; data: Device; message: string }>(`/devices/${id}/turn-off`),
  
  toggle: (id: string) =>
    api.post<{ success: boolean; data: Device; message: string }>(`/devices/${id}/toggle`),
  
  setState: (id: string, state: Record<string, any>) =>
    api.post<{ success: boolean; data: Device; message: string }>(`/devices/${id}/set-state`, state),
  
  control: (id: string, action: string, params?: any) =>
    api.post<{ success: boolean; data: Device; message: string }>(`/devices/${id}/control`, { action, params }),
  
  getDeviceLogs: (id: string, limit?: number) =>
    api.get(`/devices/${id}/logs`, { params: { limit } }),
};

export const sceneApi = {
  getScenes: (roomId?: string) =>
    api.get<{ success: boolean; data: Scene[]; message: string }>('/scenes', { params: { roomId } }),
  
  getRoomScenes: (roomId: string) =>
    api.get<{ success: boolean; data: Scene[]; message: string }>(`/scenes/room/${roomId}`),
  
  activateScene: (sceneId: string) =>
    api.post(`/scenes/${sceneId}/activate`),
  
  activateSceneForRoom: (sceneId: string, roomId: string) =>
    api.post(`/scenes/${sceneId}/activate/room/${roomId}`),
  
  create: (data: Partial<Scene>) =>
    api.post('/scenes', data),
  
  update: (id: string, data: Partial<Scene>) =>
    api.put(`/scenes/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/scenes/${id}`),
};

export const voiceApi = {
  sendCommand: (text: string, roomId?: string) =>
    api.post<{ success: boolean; data: any; message: string }>('/voice/command', { text, roomId }),
  
  getSupportedCommands: () =>
    api.get<{ success: boolean; data: string[]; message: string }>('/voice/commands'),
};

export const energyApi = {
  getMyConsumption: (period: 'day' | 'week' | 'month' = 'week') =>
    api.get<{ success: boolean; data: EnergyData; message: string }>('/energy/my-consumption', { params: { period } }),
  
  getRoomConsumption: (roomId: string, period?: 'day' | 'week' | 'month') =>
    api.get<{ success: boolean; data: EnergyData; message: string }>(`/energy/room/${roomId}`, { params: { period } }),
  
  getCurrentPower: (roomId: string) =>
    api.get<{ success: boolean; data: any; message: string }>(`/energy/room/${roomId}/current`),
  
  getHotelConsumption: (period?: 'day' | 'week' | 'month') =>
    api.get<{ success: boolean; data: EnergyData; message: string }>('/energy/hotel', { params: { period } }),
  
  getStatistics: (roomId?: string, period: 'day' | 'week' | 'month' = 'week') =>
    api.get<{ success: boolean; data: any; message: string }>('/energy/statistics', { params: { roomId, period } }),
  
  getReport: (roomId: string) =>
    api.get<{ success: boolean; data: any; message: string }>(`/energy/room/${roomId}/report`),
};

export default api;
