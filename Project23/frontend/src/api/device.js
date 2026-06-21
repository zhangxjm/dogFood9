import request from '@/utils/request'

export function getDeviceList(params) {
  return request({
    url: '/devices',
    method: 'get',
    params
  })
}

export function getDeviceDetail(id) {
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

export function getDeviceLifecycle(id) {
  return request({
    url: `/devices/${id}/lifecycle`,
    method: 'get'
  })
}

export function updateDeviceStatus(id, status) {
  return request({
    url: `/devices/${id}/status`,
    method: 'put',
    data: { status }
  })
}
