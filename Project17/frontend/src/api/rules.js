import request from '@/utils/request'

export function getRules(params) {
  return request.get('/rules', { params })
}

export function getRule(ruleId) {
  return request.get(`/rules/${ruleId}`)
}

export function createRule(data) {
  return request.post('/rules', data)
}

export function updateRule(ruleId, data) {
  return request.put(`/rules/${ruleId}`, data)
}

export function deleteRule(ruleId) {
  return request.delete(`/rules/${ruleId}`)
}

export function toggleRule(ruleId) {
  return request.post(`/rules/${ruleId}/toggle`)
}

export function getRuleTypes() {
  return request.get('/rules/types/list')
}
