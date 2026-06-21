import request from '@/utils/request'

export function getRealtimeData(params) {
  return request({
    url: '/monitor/realtime',
    method: 'get',
    params
  })
}

export function getHistoryData(params) {
  return request({
    url: '/monitor/history',
    method: 'get',
    params
  })
}

export function getDeviceMetrics(deviceId) {
  return request({
    url: `/monitor/device/${deviceId}/metrics`,
    method: 'get'
  })
}

export function getDataThresholds() {
  return request({
    url: '/monitor/thresholds',
    method: 'get'
  })
}
