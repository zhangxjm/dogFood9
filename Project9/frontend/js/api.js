const API_BASE = '/api';

async function apiRequest(url, options = {}) {
  try {
    const headers = {};
    
    if (options.body !== undefined && options.body !== null) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    const response = await fetch(API_BASE + url, {
      headers,
      ...options,
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '请求失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

const API = {
  dashboard: {
    getOverview: () => apiRequest('/dashboard'),
    getActivity: () => apiRequest('/dashboard/activity'),
  },

  equipment: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/equipment?${query}`);
    },
    getById: (id) => apiRequest(`/equipment/${id}`),
    create: (data) => apiRequest('/equipment', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/equipment/${id}`, { method: 'DELETE' }),
    install: (id, data) => apiRequest(`/equipment/${id}/install`, { method: 'POST', body: JSON.stringify(data) }),
    start: (id, operator) => apiRequest(`/equipment/${id}/start`, { method: 'POST', body: JSON.stringify({ operator }) }),
    scrap: (id, data) => apiRequest(`/equipment/${id}/scrap`, { method: 'POST', body: JSON.stringify(data) }),
    getStats: () => apiRequest('/equipment/stats'),
  },

  maintenance: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/maintenance?${query}`);
    },
    getById: (id) => apiRequest(`/maintenance/${id}`),
    create: (data) => apiRequest('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/maintenance/${id}`, { method: 'DELETE' }),
    trigger: (id) => apiRequest(`/maintenance/${id}/trigger`, { method: 'POST' }),
    generateAuto: () => apiRequest('/maintenance/generate-auto'),
  },

  workOrders: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/work-orders?${query}`);
    },
    getById: (id) => apiRequest(`/work-orders/${id}`),
    create: (data) => apiRequest('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/work-orders/${id}`, { method: 'DELETE' }),
    start: (id, operator) => apiRequest(`/work-orders/${id}/start`, { method: 'POST', body: JSON.stringify({ operator }) }),
    complete: (id, data) => apiRequest(`/work-orders/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id, reason) => apiRequest(`/work-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getStats: () => apiRequest('/work-orders/stats'),
  },

  inventory: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/inventory?${query}`);
    },
    getById: (id) => apiRequest(`/inventory/${id}`),
    create: (data) => apiRequest('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/inventory/${id}`, { method: 'DELETE' }),
    updateStock: (id, data) => apiRequest(`/inventory/${id}/stock`, { method: 'POST', body: JSON.stringify(data) }),
    smartDispatch: (data) => apiRequest('/inventory/smart-dispatch', { method: 'POST', body: JSON.stringify(data) }),
    getPurchaseSuggestion: () => apiRequest('/inventory/purchase-suggestion'),
    getStats: () => apiRequest('/inventory/stats'),
  },

  health: {
    getAllRecords: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/health?${query}`);
    },
    getEquipmentHealth: (id) => apiRequest(`/health/${id}`),
    addRecord: (id, data) => apiRequest(`/health/${id}/record`, { method: 'POST', body: JSON.stringify(data) }),
    triggerCheck: (id) => apiRequest(`/health/${id}/check`, { method: 'POST' }),
    batchCheck: () => apiRequest('/health/batch-check'),
    getReport: () => apiRequest('/health/report'),
  },

  system: {
    getInfo: () => apiRequest('/system/info'),
    getHealth: () => apiRequest('/system/health'),
    getQueueStats: () => apiRequest('/system/queue-stats'),
    getLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/system/logs?${query}`);
    },
    getPorts: () => apiRequest('/system/ports'),
  },
};
