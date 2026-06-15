import request from '@/utils/request'

export function getMLModels() {
  return request.get('/ml/models')
}

export function getActiveModel() {
  return request.get('/ml/models/active')
}

export function trainMLModel() {
  return request.post('/ml/models/train')
}

export function getFeatureImportance() {
  return request.get('/ml/features/importance')
}
