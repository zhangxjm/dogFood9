import request from '@/utils/request'

export function getCases(params) {
  return request.get('/cases', { params })
}

export function getCase(caseId) {
  return request.get(`/cases/${caseId}`)
}

export function createCase(data) {
  return request.post('/cases', data)
}

export function updateCase(caseId, data) {
  return request.put(`/cases/${caseId}`, data)
}

export function getCaseStats() {
  return request.get('/cases/stats/summary')
}
