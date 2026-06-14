const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  getPlatforms: () => request('/platforms'),
  getRooms: (platform?: string) => request(`/rooms${platform ? `?platform=${platform}` : ''}`),
  getRoom: (id: number) => request(`/rooms/${id}`),
  getLatestMetrics: () => request('/metrics/latest'),
  getRoomMetrics: (roomId: number, params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`/metrics/room/${roomId}${query ? `?${query}` : ''}`);
  },
  getPlatformOverview: (platformId: number, params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`/overview/platform/${platformId}${query ? `?${query}` : ''}`);
  },
  getRoomProducts: (roomId: number) => request(`/products/room/${roomId}`),
  getTopProducts: (limit?: number, params?: any) => {
    const query = new URLSearchParams({ limit: String(limit || 10), ...params }).toString();
    return request(`/products/top?${query}`);
  },
  getCustomReport: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return request(`/report/custom?${query}`);
  },
};
