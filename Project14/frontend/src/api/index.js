import request from '../utils/request'

export function getDevices(type) {
  return request({
    url: '/devices',
    method: 'get',
    params: { type }
  })
}

export function getDevice(id) {
  return request({
    url: `/devices/${id}`,
    method: 'get'
  })
}

export function createDevice(data) {
  return request({
    url: '/devices',
    method: 'post',
    data
  })
}

export function updateDevice(id, data) {
  return request({
    url: `/devices/${id}`,
    method: 'put',
    data
  })
}

export function deleteDevice(id) {
  return request({
    url: `/devices/${id}`,
    method: 'delete'
  })
}

export function updateDeviceStatus(id, status) {
  return request({
    url: `/devices/${id}/status`,
    method: 'patch',
    data: { status }
  })
}

export function getSensorData(params) {
  return request({
    url: '/data/sensor',
    method: 'get',
    params
  })
}

export function getLatestSensorData(deviceId) {
  return request({
    url: `/devices/${deviceId}/sensor-data/latest`,
    method: 'get'
  })
}

export function getWeatherData(params) {
  return request({
    url: '/data/weather',
    method: 'get',
    params
  })
}

export function getLatestWeatherData() {
  return request({
    url: '/data/weather/latest',
    method: 'get'
  })
}

export function startIrrigation(valveId, data) {
  return request({
    url: `/irrigation/valves/${valveId}/start`,
    method: 'post',
    data
  })
}

export function stopIrrigation(valveId) {
  return request({
    url: `/irrigation/valves/${valveId}/stop`,
    method: 'post'
  })
}

export function getValveStatus(valveId) {
  return request({
    url: `/irrigation/valves/${valveId}/status`,
    method: 'get'
  })
}

export function getIrrigationRecords(params) {
  return request({
    url: '/irrigation/records',
    method: 'get',
    params
  })
}

export function getSchedules() {
  return request({
    url: '/irrigation/schedules',
    method: 'get'
  })
}

export function createSchedule(data) {
  return request({
    url: '/irrigation/schedules',
    method: 'post',
    data
  })
}

export function updateSchedule(id, data) {
  return request({
    url: `/irrigation/schedules/${id}`,
    method: 'put',
    data
  })
}

export function deleteSchedule(id) {
  return request({
    url: `/irrigation/schedules/${id}`,
    method: 'delete'
  })
}

export function getAlerts(params) {
  return request({
    url: '/alerts',
    method: 'get',
    params
  })
}

export function getAlertStats() {
  return request({
    url: '/alerts/stats',
    method: 'get'
  })
}

export function resolveAlert(id) {
  return request({
    url: `/alerts/${id}/resolve`,
    method: 'post'
  })
}
