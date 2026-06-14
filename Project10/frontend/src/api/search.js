import request from './index.js'

export function searchFulltext(params) {
  return request({
    url: '/search/',
    method: 'get',
    params
  })
}

export function getSuggestions(query, size) {
  return request({
    url: '/search/suggest',
    method: 'get',
    params: { q: query, size }
  })
}

export function reindex() {
  return request({
    url: '/search/reindex',
    method: 'post'
  })
}
