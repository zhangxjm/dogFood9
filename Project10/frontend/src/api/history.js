import request from './index.js'

export function getHistory(params) {
  return request({
    url: '/history/',
    method: 'get',
    params
  })
}

export function addHistory(data) {
  return request({
    url: '/history/',
    method: 'post',
    data
  })
}

export function getHistoryItem(id) {
  return request({
    url: `/history/${id}`,
    method: 'get'
  })
}

export function revertToHistory(pageId, historyId) {
  return request({
    url: `/history/pages/${pageId}/revert/${historyId}`,
    method: 'post'
  })
}
