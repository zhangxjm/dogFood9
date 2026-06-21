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
    url: `/alerts/${id}/resolve`,
    method: 'put',
    data
  })
}

export function getPredictionAnalysis(params) {
  return request({
    url: '/predictions/all',
    method: 'get',
    params
  })
}

export function getAlertStats() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}

export function getAlertHistory(params) {
  return request({
    url: '/alerts',
    method: 'get',
    params
  })
}
