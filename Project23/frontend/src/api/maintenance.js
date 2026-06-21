import request from '@/utils/request'

export function getMaintenancePlanList(params) {
  return request({
    url: '/maintenance/plans',
    method: 'get',
    params
  })
}

export function getMaintenancePlanDetail(id) {
  return request({
    url: `/maintenance/plans/${id}`,
    method: 'get'
  })
}

export function createMaintenancePlan(data) {
  return request({
    url: '/maintenance/plans',
    method: 'post',
    data
  })
}

export function updateMaintenancePlan(id, data) {
  return request({
    url: `/maintenance/plans/${id}`,
    method: 'put',
    data
  })
}

export function deleteMaintenancePlan(id) {
  return request({
    url: `/maintenance/plans/${id}`,
    method: 'delete'
  })
}

export function getMaintenanceRecordList(params) {
  return request({
    url: '/maintenance/records',
    method: 'get',
    params
  })
}

export function getMaintenanceRecordDetail(id) {
  return request({
    url: `/maintenance/records/${id}`,
    method: 'get'
  })
}

export function createMaintenanceRecord(data) {
  return request({
    url: '/maintenance/records',
    method: 'post',
    data
  })
}

export function updateMaintenanceRecord(id, data) {
  return request({
    url: `/maintenance/records/${id}`,
    method: 'put',
    data
  })
}
