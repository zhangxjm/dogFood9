import request from '@/utils/request'

export function getDashboardStats() {
  return request({
    url: '/dashboard/stats',
    method: 'get'
  })
}

export function getDeviceStatusOverview() {
  return request({
    url: '/dashboard/device-status',
    method: 'get'
  })
}

export function getAlertStats() {
  return request({
    url: '/dashboard/alert-stats',
    method: 'get'
  })
}

export function getRealtimeDataTrend(params) {
  return request({
    url: '/dashboard/data-trend',
    method: 'get',
    params
  })
}

export function getRecentAlerts(params) {
  return request({
    url: '/dashboard/recent-alerts',
    method: 'get',
    params
  })
}
