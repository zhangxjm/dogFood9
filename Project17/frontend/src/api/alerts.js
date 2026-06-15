import request from '@/utils/request'

export function getAlerts(params) {
  return request.get('/alerts', { params })
}

export function getAlert(alertId) {
  return request.get(`/alerts/${alertId}`)
}

export function handleAlert(alertId, data) {
  return request.put(`/alerts/${alertId}/handle`, data)
}

export function getAlertStats() {
  return request.get('/alerts/stats/summary')
}
