import request from '@/utils/request'

export function getSparePartList(params) {
  return request({
    url: '/spareparts',
    method: 'get',
    params
  })
}

export function getSparePartDetail(id) {
  return request({
    url: `/spareparts/${id}`,
    method: 'get'
  })
}

export function createSparePart(data) {
  return request({
    url: '/spareparts',
    method: 'post',
    data
  })
}

export function updateSparePart(id, data) {
  return request({
    url: `/spareparts/${id}`,
    method: 'put',
    data
  })
}

export function deleteSparePart(id) {
  return request({
    url: `/spareparts/${id}`,
    method: 'delete'
  })
}

export function getStockRecords(params) {
  return request({
    url: '/spareparts/stock-records',
    method: 'get',
    params
  })
}

export function stockIn(data) {
  return request({
    url: '/spareparts/stock-in',
    method: 'post',
    data
  })
}

export function stockOut(data) {
  return request({
    url: '/spareparts/stock-out',
    method: 'post',
    data
  })
}

export function getStockWarning() {
  return request({
    url: '/spareparts/warning',
    method: 'get'
  })
}
