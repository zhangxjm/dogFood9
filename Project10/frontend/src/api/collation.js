import request from './index.js'

export function convertVariantChar(data) {
  return request({
    url: '/collation/convert-variants',
    method: 'post',
    data
  })
}

export function insertPunctuation(data) {
  return request({
    url: '/collation/insert-punctuation',
    method: 'post',
    data
  })
}

export function compareTexts(data) {
  return request({
    url: '/collation/compare',
    method: 'post',
    data
  })
}

export function compareVersions(data) {
  return request({
    url: '/collation/compare-versions',
    method: 'post',
    data
  })
}

export function semanticCollate(data) {
  return request({
    url: '/collation/semantic-collate',
    method: 'post',
    data
  })
}

export function autoCollate(data) {
  return request({
    url: '/collation/auto-collate',
    method: 'post',
    data
  })
}

export function getAnnotations(pageId) {
  return request({
    url: `/collation/pages/${pageId}/annotations`,
    method: 'get'
  })
}

export function addAnnotation(pageId, data) {
  return request({
    url: `/collation/pages/${pageId}/annotations`,
    method: 'post',
    data
  })
}

export function updateAnnotation(annotationId, data) {
  return request({
    url: `/collation/annotations/${annotationId}`,
    method: 'put',
    data
  })
}

export function deleteAnnotation(annotationId) {
  return request({
    url: `/collation/annotations/${annotationId}`,
    method: 'delete'
  })
}

export function getVariantChars(params) {
  return request({
    url: '/collation/variant-chars',
    method: 'get',
    params
  })
}

export function lookupVariantChar(char) {
  return request({
    url: '/collation/variant-chars/lookup',
    method: 'get',
    params: { char }
  })
}

export function getCollationHistory(pageId) {
  return request({
    url: '/history/',
    method: 'get',
    params: { page_id: pageId }
  })
}

export function saveCollationHistory(pageId, data) {
  return request({
    url: '/history/',
    method: 'post',
    data: { ...data, page_id: pageId }
  })
}

export function revertCollation(pageId, historyId) {
  return request({
    url: `/history/pages/${pageId}/revert/${historyId}`,
    method: 'post'
  })
}
