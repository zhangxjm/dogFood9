import request from '@/utils/request'

export function getTransactions(params) {
  return request.get('/transactions', { params })
}

export function getTransaction(transactionId) {
  return request.get(`/transactions/${transactionId}`)
}

export function createTransaction(data) {
  return request.post('/transactions', data)
}

export function detectFraud(transactionId) {
  return request.post(`/transactions/${transactionId}/detect`)
}
