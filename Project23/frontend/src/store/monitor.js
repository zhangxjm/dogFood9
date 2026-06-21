import { defineStore } from 'pinia'
import { ref } from 'vue'
import websocket from '@/utils/websocket'

export const useMonitorStore = defineStore('monitor', () => {
  const realtimeData = ref({
    temperature: [],
    vibration: [],
    pressure: [],
    current: []
  })
  const currentMetrics = ref({
    temperature: 0,
    vibration: 0,
    pressure: 0,
    current: 0
  })
  const wsConnected = ref(false)
  const maxDataPoints = 60

  function updateRealtimeData(type, value, timestamp) {
    if (!realtimeData.value[type]) {
      realtimeData.value[type] = []
    }
    realtimeData.value[type].push({ value, timestamp })
    if (realtimeData.value[type].length > maxDataPoints) {
      realtimeData.value[type].shift()
    }
    currentMetrics.value[type] = value
  }

  function handleWsMessage(data) {
    if (data && data.type === 'metrics') {
      const { deviceId, metrics, timestamp } = data.data || data
      if (metrics) {
        Object.keys(metrics).forEach(key => {
          updateRealtimeData(key, metrics[key], timestamp || Date.now())
        })
      }
    }
  }

  async function connectWebSocket() {
    try {
      await websocket.connect()
      wsConnected.value = true
      websocket.on('message', handleWsMessage)
      websocket.on('metrics', (data) => {
        if (data && data.metrics) {
          Object.keys(data.metrics).forEach(key => {
            updateRealtimeData(key, data.metrics[key], data.timestamp || Date.now())
          })
        }
      })
      websocket.on('close', () => {
        wsConnected.value = false
      })
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      wsConnected.value = false
    }
  }

  function disconnectWebSocket() {
    websocket.close()
    wsConnected.value = false
  }

  function resetData() {
    realtimeData.value = {
      temperature: [],
      vibration: [],
      pressure: [],
      current: []
    }
    currentMetrics.value = {
      temperature: 0,
      vibration: 0,
      pressure: 0,
      current: 0
    }
  }

  return {
    realtimeData,
    currentMetrics,
    wsConnected,
    updateRealtimeData,
    connectWebSocket,
    disconnectWebSocket,
    resetData
  }
})
