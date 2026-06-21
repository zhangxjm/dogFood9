import request from '@/utils/request'

export function getSparePartList(params) {
  return request({
    url: '/spare-parts',
    method: 'get',
    params
  })
}

export function getSparePartDetail(id) {
  return request({
    url: `/spare-parts/${id}`,
    method: 'get'
  })
}

export function createSparePart(data) {
  return request({
    url: '/spare-parts',
    method: 'post',
    data
  })
}

export function updateSparePart(id, data) {
  return request({
    url: `/spare-parts/${id}`,
    method: 'put',
    data
  })
}

export function deleteSparePart(id) {
  return request({
    url: `/spare-parts/${id}`,
    method: 'delete'
  })
}

export function getStockRecords(params) {
  return request({
    url: '/spare-part-stocks',
    method: 'get',
    params
  })
}

export function stockIn(data) {
  return request({
    url: '/spare-part-stocks',
    method: 'post',
    data
  })
}

export function stockOut(data) {
  return request({
    url: `/spare-part-stocks/${data.id}`,
    method: 'put',
    data
  })
}

export function getStockWarning() {
  return request({
    url: '/spare-part-stocks',
    method: 'get',
    params: { low_stock: true }
  })
}
