import request from './index.js'

export function convertVariants(text) {
  return request({
    url: '/collation/convert-variants',
    method: 'post',
    data: { text }
  })
}

export function insertPunctuation(text) {
  return request({
    url: '/collation/insert-punctuation',
    method: 'post',
    data: { text }
  })
}

export function compareTexts(text1, text2, label1, label2) {
  return request({
    url: '/collation/compare',
    method: 'post',
    data: { text1, text2, label1, label2 }
  })
}

export function compareVersions(version1_id, version2_id) {
  return request({
    url: '/collation/compare-versions',
    method: 'post',
    data: { version1_id, version2_id }
  })
}

export function semanticCollate(text, context_text) {
  return request({
    url: '/collation/semantic-collate',
    method: 'post',
    data: { text, context_text }
  })
}

export function autoCollate(text, context_text, steps) {
  return request({
    url: '/collation/auto-collate',
    method: 'post',
    data: { text, context_text, steps }
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
