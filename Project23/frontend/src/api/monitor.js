import request from '@/utils/request'

export function getRealtimeData(params) {
  return request({
    url: '/device-data/latest/' + (params.device_id || '1'),
    method: 'get'
  })
}

export function getHistoryData(params) {
  return request({
    url: '/device-data',
    method: 'get',
    params
  })
}

export function getDeviceMetrics(deviceId) {
  return request({
    url: `/device-data/trend/${deviceId}`,
    method: 'get'
  })
}

export function getDataThresholds() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}
