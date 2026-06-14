import axios from 'axios';

const request = axios.create({
  baseURL: '',
  timeout: 10000,
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && res.code === 200) {
      return res.data;
    }
    return res;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export const getSpots = () => request.get('/api/spots');
export const updateSpots = (data) => request.put('/api/spots', data);
export const getSpotsSummary = () => request.get('/api/spots/summary');

export const vehicleEntry = (plateNumber) => request.post('/api/entry', { plateNumber });
export const vehicleExit = (plateNumber) => request.post('/api/exit', { plateNumber });

export const getRecords = (params) => request.get('/api/records', { params });
export const getCurrentParked = () => request.get('/api/records/current');

export const getBilling = (plateNumber) => request.get(`/api/billing/current/${plateNumber}`);
export const getBillingRecords = (params) => request.get('/api/billing/records', { params });
export const payBill = (data) => request.post('/api/billing/pay', data);
export const getBillingRules = () => request.get('/api/billing/rules');
export const updateBillingRules = (data) => request.put('/api/billing/rules', data);

export const getVehicles = (params) => request.get('/api/vehicles', { params });
export const registerVehicle = (data) => request.post('/api/vehicles', data);
export const getVehicleByPlate = (plateNumber) => request.get(`/api/vehicles/${plateNumber}`);

export const getMonthlyRentals = (params) => request.get('/api/monthly', { params });
export const createMonthlyRental = (data) => request.post('/api/monthly', data);
export const renewMonthlyRental = (id, data) => request.put(`/api/monthly/${id}/renew`, data);
export const getExpiringRentals = () => request.get('/api/monthly/expiring');

export const getReservations = (params) => request.get('/api/reservations', { params });
export const createReservation = (data) => request.post('/api/reservations', data);
export const cancelReservation = (id) => request.delete(`/api/reservations/${id}`);

export const getAlerts = (params) => request.get('/api/alerts', { params });
export const resolveAlert = (id) => request.put(`/api/alerts/${id}/resolve`);

export const getDevices = () => request.get('/api/hardware/devices');
export const sendDeviceCommand = (id, data) => request.post(`/api/hardware/devices/${id}/command`, data);
export const reconnectDevice = (id) => request.post(`/api/hardware/devices/${id}/reconnect`);

export const getDashboardOverview = () => request.get('/api/dashboard/overview');
export const getDashboardToday = () => request.get('/api/dashboard/today');
export const getDashboardChart = (params) => request.get('/api/dashboard/chart', { params });

export function createParkingWebSocket(onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/ws/parking`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('WebSocket 已连接');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('WebSocket 消息解析失败:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket 已断开');
  };

  return ws;
}
