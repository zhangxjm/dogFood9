import request from '@/utils/request'

export function getDashboardStats() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}

export function getDeviceStatusOverview() {
  return request({
    url: '/statistics/device-status-distribution',
    method: 'get'
  })
}

export function getAlertStats() {
  return request({
    url: '/statistics/alert-type-distribution',
    method: 'get'
  })
}

export function getRealtimeDataTrend(params) {
  return request({
    url: '/device-data/trend/' + (params.device_id || '1'),
    method: 'get',
    params
  })
}

export function getRecentAlerts(params) {
  return request({
    url: '/alerts',
    method: 'get',
    params
  })
}
