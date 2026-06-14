<template>
  <div class="data-monitor">
    <div class="common-card">
      <h3 class="section-title">实时气象数据</h3>
      <div class="weather-cards">
        <div class="weather-card">
          <el-icon :size="28" color="#409eff"><Sunny /></el-icon>
          <div class="weather-card-info">
            <span class="weather-card-value">{{ latestWeather?.temperature?.toFixed(1) || '--' }}°C</span>
            <span class="weather-card-label">温度</span>
          </div>
        </div>
        <div class="weather-card">
          <el-icon :size="28" color="#67c23a"><Watermelon /></el-icon>
          <div class="weather-card-info">
            <span class="weather-card-value">{{ latestWeather?.humidity?.toFixed(1) || '--' }}%</span>
            <span class="weather-card-label">湿度</span>
          </div>
        </div>
        <div class="weather-card">
          <el-icon :size="28" color="#e6a23c"><Wind /></el-icon>
          <div class="weather-card-info">
            <span class="weather-card-value">{{ latestWeather?.wind_speed?.toFixed(1) || '--' }} m/s</span>
            <span class="weather-card-label">风速</span>
          </div>
        </div>
        <div class="weather-card">
          <el-icon :size="28" color="#909399"><Rainy /></el-icon>
          <div class="weather-card-info">
            <span class="weather-card-value">{{ latestWeather?.rainfall?.toFixed(1) || '--' }} mm</span>
            <span class="weather-card-label">降雨量</span>
          </div>
        </div>
        <div class="weather-card">
          <el-icon :size="28" color="#f56c6c"><Gauge /></el-icon>
          <div class="weather-card-info">
            <span class="weather-card-value">{{ latestWeather?.pressure?.toFixed(0) || '--' }} hPa</span>
            <span class="weather-card-label">气压</span>
          </div>
        </div>
        <div class="weather-card">
          <el-icon :size="28" color="#409eff"><Sunset /></el-icon>
          <div class="weather-card-info">
            <span class="weather-card-value">{{ latestWeather?.uv_index?.toFixed(1) || '--' }}</span>
            <span class="weather-card-label">紫外线指数</span>
          </div>
        </div>
      </div>
    </div>

    <div class="common-card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom: 0;">土壤湿度监测</h3>
        <el-select v-model="selectedDevice" placeholder="选择传感器" style="width: 200px;" @change="loadSensorChart">
          <el-option v-for="sensor in soilSensors" :key="sensor.id" :label="sensor.name" :value="sensor.id" />
        </el-select>
      </div>
      <div ref="moistureChart" class="chart-container large"></div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="common-card">
          <h3 class="section-title">温度变化趋势</h3>
          <div ref="tempChart" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="common-card">
          <h3 class="section-title">湿度变化趋势</h3>
          <div ref="humidityChart" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getLatestWeatherData, getDevices, getSensorData } from '../api'

const latestWeather = ref(null)
const soilSensors = ref([])
const selectedDevice = ref('')
const moistureChart = ref(null)
const tempChart = ref(null)
const humidityChart = ref(null)
let moistureChartInstance = null
let tempChartInstance = null
let humidityChartInstance = null
let ws = null

const loadLatestWeather = async () => {
  try {
    latestWeather.value = await getLatestWeatherData()
  } catch (e) {
    console.error('Failed to load weather:', e)
  }
}

const loadSoilSensors = async () => {
  try {
    const devices = await getDevices()
    soilSensors.value = devices.filter(d => d.type === 'soil_sensor')
    if (soilSensors.value.length > 0) {
      selectedDevice.value = soilSensors.value[0].id
      loadSensorChart()
    }
  } catch (e) {
    console.error('Failed to load sensors:', e)
  }
}

const loadSensorChart = async () => {
  if (!selectedDevice.value) return
  
  try {
    const data = await getSensorData({ device_id: selectedDevice.value, limit: 100 })
    updateCharts(data)
  } catch (e) {
    console.error('Failed to load sensor data:', e)
  }
}

const initCharts = () => {
  if (moistureChart.value) {
    moistureChartInstance = echarts.init(moistureChart.value)
    moistureChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['土壤湿度'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: [] },
      yAxis: { type: 'value', name: '湿度(%)', min: 0, max: 100 },
      series: [{
        name: '土壤湿度',
        type: 'line',
        smooth: true,
        data: [],
        areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
        lineStyle: { color: '#409eff', width: 2 },
        itemStyle: { color: '#409eff' }
      }]
    })
  }

  if (tempChart.value) {
    tempChartInstance = echarts.init(tempChart.value)
    tempChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['空气温度', '土壤温度'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: [] },
      yAxis: { type: 'value', name: '温度(°C)' },
      series: [
        {
          name: '空气温度',
          type: 'line',
          smooth: true,
          data: [],
          lineStyle: { color: '#f56c6c', width: 2 },
          itemStyle: { color: '#f56c6c' }
        },
        {
          name: '土壤温度',
          type: 'line',
          smooth: true,
          data: [],
          lineStyle: { color: '#e6a23c', width: 2 },
          itemStyle: { color: '#e6a23c' }
        }
      ]
    })
  }

  if (humidityChart.value) {
    humidityChartInstance = echarts.init(humidityChart.value)
    humidityChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['空气湿度'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: [] },
      yAxis: { type: 'value', name: '湿度(%)', min: 0, max: 100 },
      series: [{
        name: '空气湿度',
        type: 'line',
        smooth: true,
        data: [],
        areaStyle: { color: 'rgba(103, 194, 58, 0.2)' },
        lineStyle: { color: '#67c23a', width: 2 },
        itemStyle: { color: '#67c23a' }
      }]
    })
  }
}

const updateCharts = (data) => {
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const times = sortedData.map(d => {
    const date = new Date(d.timestamp)
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  })

  if (moistureChartInstance) {
    moistureChartInstance.setOption({
      xAxis: { data: times },
      series: [{ data: sortedData.map(d => d.soil_moisture) }]
    })
  }

  if (tempChartInstance) {
    tempChartInstance.setOption({
      xAxis: { data: times },
      series: [
        { data: sortedData.map(d => d.temperature) },
        { data: sortedData.map(d => d.soil_temp) }
      ]
    })
  }

  if (humidityChartInstance) {
    humidityChartInstance.setOption({
      xAxis: { data: times },
      series: [{ data: sortedData.map(d => d.humidity) }]
    })
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'weather_data') {
        latestWeather.value = msg.data
      } else if (msg.type === 'sensor_data') {
        if (msg.data.device_id === selectedDevice.value) {
          loadSensorChart()
        }
      }
    } catch (e) {
      console.error('WebSocket error:', e)
    }
  }

  ws.onclose = () => {
    setTimeout(connectWebSocket, 3000)
  }
}

const handleResize = () => {
  moistureChartInstance?.resize()
  tempChartInstance?.resize()
  humidityChartInstance?.resize()
}

onMounted(async () => {
  await nextTick()
  initCharts()
  loadLatestWeather()
  loadSoilSensors()
  connectWebSocket()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (ws) ws.close()
  moistureChartInstance?.dispose()
  tempChartInstance?.dispose()
  humidityChartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.weather-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.weather-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
}

.weather-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.weather-card-info {
  text-align: center;
}

.weather-card-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.weather-card-label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.chart-container {
  height: 280px;
  width: 100%;
}

.chart-container.large {
  height: 350px;
}
</style>
