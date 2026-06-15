import request from '@/utils/request'

export function getDashboardStats() {
  return request.get('/dashboard/stats')
}

export function getTransactionChart() {
  return request.get('/dashboard/chart/transactions')
}

export function getRiskDistribution() {
  return request.get('/dashboard/chart/risk-distribution')
}

export function getFraudTypes() {
  return request.get('/dashboard/chart/fraud-types')
}

export function getTopFraudUsers(limit = 10) {
  return request.get(`/dashboard/chart/top-fraud-users?limit=${limit}`)
}

export function getRecentAlerts(limit = 10) {
  return request.get(`/dashboard/recent-alerts?limit=${limit}`)
}

export function getRecentTransactions(limit = 10) {
  return request.get(`/dashboard/recent-transactions?limit=${limit}`)
}
