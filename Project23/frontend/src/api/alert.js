import request from '@/utils/request'

export function getAlertList(params) {
  return request({
    url: '/alerts',
    method: 'get',
    params
  })
}

export function getAlertDetail(id) {
  return request({
    url: `/alerts/${id}`,
    method: 'get'
  })
}

export function handleAlert(id, data) {
  return request({
    url: `/alerts/${id}/handle`,
    method: 'put',
    data
  })
}

export function getPredictionAnalysis(params) {
  return request({
    url: '/alerts/prediction',
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

export function getAlertHistory(params) {
  return request({
    url: '/alerts/history',
    method: 'get',
    params
  })
}
