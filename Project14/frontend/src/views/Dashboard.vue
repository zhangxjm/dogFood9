<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card stat-blue">
          <div class="stat-icon">
            <el-icon :size="32"><Cpu /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ deviceStats.total }}</div>
            <div class="stat-label">设备总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-green">
          <div class="stat-icon">
            <el-icon :size="32"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ deviceStats.online }}</div>
            <div class="stat-label">在线设备</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-orange">
          <div class="stat-icon">
            <el-icon :size="32"><Watermelon /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ irrigationCount }}</div>
            <div class="stat-label">正在灌溉</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-red">
          <div class="stat-icon">
            <el-icon :size="32"><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ alertCount }}</div>
            <div class="stat-label">未处理告警</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="common-card">
          <h3 class="section-title">土壤湿度趋势</h3>
          <div ref="moistureChart" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="common-card">
          <h3 class="section-title">实时气象</h3>
          <div v-if="weatherData" class="weather-info">
            <div class="weather-main">
              <span class="weather-temp">{{ weatherData.temperature?.toFixed(1) }}°C</span>
              <span class="weather-forecast">{{ weatherData.forecast }}</span>
            </div>
            <div class="weather-details">
              <div class="weather-item">
                <span class="weather-label">湿度</span>
                <span class="weather-value">{{ weatherData.humidity?.toFixed(1) }}%</span>
              </div>
              <div class="weather-item">
                <span class="weather-label">风速</span>
                <span class="weather-value">{{ weatherData.wind_speed?.toFixed(1) }} m/s</span>
              </div>
              <div class="weather-item">
                <span class="weather-label">降雨量</span>
                <span class="weather-value">{{ weatherData.rainfall?.toFixed(1) }} mm</span>
              </div>
              <div class="weather-item">
                <span class="weather-label">气压</span>
                <span class="weather-value">{{ weatherData.pressure?.toFixed(0) }} hPa</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="common-card">
          <h3 class="section-title">设备状态</h3>
          <div ref="deviceChart" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="common-card">
          <h3 class="section-title">最近告警</h3>
          <el-table :data="recentAlerts" size="small">
            <el-table-column prop="level" label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="alertLevelType(row.level)" size="small">
                  {{ alertLevelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="created_at" label="时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDevices, getLatestWeatherData, getAlerts, getAlertStats, getSensorData } from '../api'

const deviceStats = ref({ total: 0, online: 0, offline: 0, fault: 0 })
const irrigationCount = ref(0)
const alertCount = ref(0)
const weatherData = ref(null)
const recentAlerts = ref([])
const moistureChart = ref(null)
const deviceChart = ref(null)
let moistureChartInstance = null
let deviceChartInstance = null
let ws = null

const alertLevelType = (level) => {
  const types = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    critical: 'danger'
  }
  return types[level] || 'info'
}

const alertLevelText = (level) => {
  const texts = {
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重'
  }
  return texts[level] || level
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const loadDeviceStats = async () => {
  try {
    const devices = await getDevices()
    deviceStats.value.total = devices.length
    deviceStats.value.online = devices.filter(d => d.status === 'online').length
    deviceStats.value.offline = devices.filter(d => d.status === 'offline').length
    deviceStats.value.fault = devices.filter(d => d.status === 'fault').length
    
    const valves = devices.filter(d => d.type === 'valve')
    irrigationCount.value = valves.filter(d => d.status === 'online').length
    
    updateDeviceChart()
  } catch (e) {
    console.error('Failed to load device stats:', e)
  }
}

const loadWeatherData = async () => {
  try {
    weatherData.value = await getLatestWeatherData()
  } catch (e) {
    console.error('Failed to load weather data:', e)
  }
}

const loadAlerts = async () => {
  try {
    const alerts = await getAlerts({ limit: 5, resolved: false })
    recentAlerts.value = alerts
    const stats = await getAlertStats()
    alertCount.value = stats.unresolved_count
  } catch (e) {
    console.error('Failed to load alerts:', e)
  }
}

const loadMoistureData = async () => {
  try {
    const data = await getSensorData({ limit: 50 })
    updateMoistureChart(data)
  } catch (e) {
    console.error('Failed to load moisture data:', e)
  }
}

const initMoistureChart = () => {
  if (!moistureChart.value) return
  moistureChartInstance = echarts.init(moistureChart.value)
  moistureChartInstance.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['土壤湿度']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value',
      name: '湿度(%)',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '土壤湿度',
        type: 'line',
        smooth: true,
        data: [],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  })
}

const updateMoistureChart = (data) => {
  if (!moistureChartInstance) return
  
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const times = sortedData.map(d => {
    const date = new Date(d.timestamp)
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  })
  const values = sortedData.map(d => d.soil_moisture)
  
  moistureChartInstance.setOption({
    xAxis: { data: times },
    series: [{ data: values }]
  })
}

const initDeviceChart = () => {
  if (!deviceChart.value) return
  deviceChartInstance = echarts.init(deviceChart.value)
  updateDeviceChart()
}

const updateDeviceChart = () => {
  if (!deviceChartInstance) return
  deviceChartInstance.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center'
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: deviceStats.value.online, name: '在线', itemStyle: { color: '#67c23a' } },
          { value: deviceStats.value.offline, name: '离线', itemStyle: { color: '#909399' } },
          { value: deviceStats.value.fault, name: '故障', itemStyle: { color: '#f56c6c' } }
        ]
      }
    ]
  })
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'sensor_data') {
        loadMoistureData()
        loadDeviceStats()
      } else if (msg.type === 'weather_data') {
        loadWeatherData()
      } else if (msg.type === 'alert') {
        loadAlerts()
      } else if (msg.type === 'irrigation_start') {
        irrigationCount.value++
      }
    } catch (e) {
      console.error('WebSocket message error:', e)
    }
  }

  ws.onclose = () => {
    setTimeout(connectWebSocket, 3000)
  }
}

const handleResize = () => {
  moistureChartInstance?.resize()
  deviceChartInstance?.resize()
}

onMounted(async () => {
  await nextTick()
  initMoistureChart()
  initDeviceChart()
  
  loadDeviceStats()
  loadWeatherData()
  loadAlerts()
  loadMoistureData()
  
  connectWebSocket()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (ws) ws.close()
  moistureChartInstance?.dispose()
  deviceChartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-blue .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-green .stat-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-orange .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-red .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.chart-container {
  height: 280px;
  width: 100%;
}

.weather-info {
  padding: 10px 0;
}

.weather-main {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 24px;
}

.weather-temp {
  font-size: 48px;
  font-weight: 300;
  color: #1f2937;
  line-height: 1;
}

.weather-forecast {
  font-size: 18px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 12px;
}

.weather-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.weather-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.weather-label {
  color: #6b7280;
  font-size: 14px;
}

.weather-value {
  color: #1f2937;
  font-weight: 600;
  font-size: 14px;
}
</style>
