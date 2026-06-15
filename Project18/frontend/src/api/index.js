import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const statsAPI = {
  getStats: () => api.get('/stats'),
  getTracking: () => api.get('/tracking')
}

export const warehouseAPI = {
  getAll: () => api.get('/warehouses'),
  get: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`)
}

export const driverAPI = {
  getAll: () => api.get('/drivers'),
  get: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`)
}

export const vehicleAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  updateLocation: (id, data) => api.put(`/vehicles/${id}/location`, data)
}

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
}

export const routeAPI = {
  getAll: (params) => api.get('/routes', { params }),
  get: (id) => api.get(`/routes/${id}`),
  optimize: (data) => api.post('/routes/optimize', data),
  save: (data) => api.post('/routes/save', data),
  start: (id) => api.post(`/routes/${id}/start`),
  complete: (id) => api.post(`/routes/${id}/complete`)
}

export default api
