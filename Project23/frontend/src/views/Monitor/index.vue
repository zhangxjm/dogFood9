<template>
  <div class="real-time-monitor">
    <div class="page-header">
      <h2 class="page-title">实时监控</h2>
      <div class="header-actions">
        <el-select v-model="selectedDevice" placeholder="选择设备" style="width: 200px; margin-right: 16px" @change="onDeviceChange">
          <el-option
            v-for="device in deviceList"
            :key="device.id"
            :label="device.name"
            :value="device.id"
          />
        </el-select>
        <el-tag :type="wsConnected ? 'success' : 'danger'" size="large" effect="dark">
          <span class="dot" :class="{ active: wsConnected }"></span>
          {{ wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接' }}
        </el-tag>
        <el-button
          :type="wsConnected ? 'danger' : 'success'"
          style="margin-left: 16px"
          @click="toggleConnection"
        >
          <el-icon v-if="!wsConnected"><Connection /></el-icon>
          <el-icon v-else><Close /></el-icon>
          {{ wsConnected ? '断开连接' : '连接' }}
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <div class="metric-card temperature">
          <div class="metric-header">
            <el-icon :size="24"><Sunny /></el-icon>
            <span>温度</span>
          </div>
          <div class="metric-body">
            <span class="value" :class="{ warning: currentMetrics.temp > 80 }">
              {{ currentMetrics.temp.toFixed(1) }}
            </span>
            <span class="unit">°C</span>
          </div>
          <div class="metric-footer">
            <span>正常范围: 40 - 80°C</span>
            <el-progress
              :percentage="Math.min(100, (currentMetrics.temp / 100) * 100)"
              :color="currentMetrics.temp > 80 ? '#F56C6C' : '#67C23A'"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card vibration">
          <div class="metric-header">
            <el-icon :size="24"><Odometer /></el-icon>
            <span>振动</span>
          </div>
          <div class="metric-body">
            <span class="value" :class="{ warning: currentMetrics.vibration > 6 }">
              {{ currentMetrics.vibration.toFixed(2) }}
            </span>
            <span class="unit">mm/s</span>
          </div>
          <div class="metric-footer">
            <span>正常范围: 0 - 6 mm/s</span>
            <el-progress
              :percentage="Math.min(100, (currentMetrics.vibration / 10) * 100)"
              :color="currentMetrics.vibration > 6 ? '#F56C6C' : '#67C23A'"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card pressure">
          <div class="metric-header">
            <el-icon :size="24"><Gauge /></el-icon>
            <span>压力</span>
          </div>
          <div class="metric-body">
            <span class="value" :class="{ warning: currentMetrics.pressure > 0.8 }">
              {{ currentMetrics.pressure.toFixed(2) }}
            </span>
            <span class="unit">MPa</span>
          </div>
          <div class="metric-footer">
            <span>正常范围: 0.3 - 0.8 MPa</span>
            <el-progress
              :percentage="Math.min(100, (currentMetrics.pressure / 1) * 100)"
              :color="currentMetrics.pressure > 0.8 ? '#F56C6C' : '#67C23A'"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card current">
          <div class="metric-header">
            <el-icon :size="24"><Lightning /></el-icon>
            <span>电流</span>
          </div>
          <div class="metric-body">
            <span class="value" :class="{ warning: currentMetrics.current > 30 }">
              {{ currentMetrics.current.toFixed(1) }}
            </span>
            <span class="unit">A</span>
          </div>
          <div class="metric-footer">
            <span>正常范围: 10 - 30 A</span>
            <el-progress
              :percentage="Math.min(100, (currentMetrics.current / 40) * 100)"
              :color="currentMetrics.current > 30 ? '#F56C6C' : '#67C23A'"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12" class="mb-20">
        <div class="chart-container">
          <h3 class="chart-title">温度实时曲线</h3>
          <v-chart :option="temperatureOption" style="height: 280px" autoresize />
        </div>
      </el-col>
      <el-col :span="12" class="mb-20">
        <div class="chart-container">
          <h3 class="chart-title">振动实时曲线</h3>
          <v-chart :option="vibrationOption" style="height: 280px" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <h3 class="chart-title">压力实时曲线</h3>
          <v-chart :option="pressureOption" style="height: 280px" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <h3 class="chart-title">电流实时曲线</h3>
          <v-chart :option="currentOption" style="height: 280px" autoresize />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMonitorStore } from '@/store/monitor'
import { ElMessage } from 'element-plus'
import { getDeviceList } from '@/api/device'
import { getDeviceMetrics } from '@/api/monitor'

const monitorStore = useMonitorStore()
const wsConnected = computed(() => monitorStore.wsConnected)
const realtimeData = computed(() => monitorStore.realtimeData)

const selectedDevice = ref(null)
const deviceList = ref([])

const currentMetrics = reactive({
  temp: 0,
  vibration: 0,
  pressure: 0,
  current: 0
})

onMounted(async () => {
  await loadDeviceList()
  if (selectedDevice.value) {
    await loadHistoricalData(selectedDevice.value)
  }
})

onUnmounted(() => {
  monitorStore.resetData()
})

async function loadDeviceList() {
  try {
    const res = await getDeviceList({ page: 1, pageSize: 100 })
    if (res?.data?.list) {
      deviceList.value = res.data.list
      if (deviceList.value.length > 0 && !selectedDevice.value) {
        selectedDevice.value = deviceList.value[0].id
      }
    }
  } catch (e) {
    ElMessage.error('加载设备列表失败')
  }
}

async function loadHistoricalData(deviceId) {
  try {
    monitorStore.resetData()
    const res = await getDeviceMetrics(deviceId)
    if (res?.data?.data) {
      const dataList = res.data.data
      for (const item of dataList) {
        const ts = new Date(item.timestamp).getTime()
        monitorStore.updateRealtimeData('temperature', item.temp, ts)
        monitorStore.updateRealtimeData('vibration', item.vibration, ts)
        monitorStore.updateRealtimeData('pressure', item.pressure, ts)
        monitorStore.updateRealtimeData('current', item.current, ts)
      }
      updateCurrentMetrics()
    }
  } catch (e) {
    ElMessage.error('加载历史数据失败')
  }
}

function onDeviceChange(deviceId) {
  loadHistoricalData(deviceId)
}

function updateCurrentMetrics() {
  const tempData = realtimeData.value.temperature
  const vibData = realtimeData.value.vibration
  const pressData = realtimeData.value.pressure
  const currData = realtimeData.value.current

  if (tempData.length) currentMetrics.temp = tempData[tempData.length - 1].value
  if (vibData.length) currentMetrics.vibration = vibData[vibData.length - 1].value
  if (pressData.length) currentMetrics.pressure = pressData[pressData.length - 1].value
  if (currData.length) currentMetrics.current = currData[currData.length - 1].value
}

async function toggleConnection() {
  if (wsConnected.value) {
    monitorStore.disconnectWebSocket()
    ElMessage.info('已断开WebSocket连接')
  } else {
    try {
      await monitorStore.connectWebSocket()
      ElMessage.success('WebSocket连接成功')
    } catch (e) {
      ElMessage.error('WebSocket连接失败')
    }
  }
}

watch(realtimeData, () => {
  updateCurrentMetrics()
}, { deep: true })

function generateLineOption(data, color, unit, max) {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const p = params[0]
        const time = new Date(p.data[0]).toLocaleTimeString('zh-CN')
        return `${time}<br/>${unit === '°C' ? '温度' : unit === 'mm/s' ? '振动' : unit === 'MPa' ? '压力' : '电流'}: ${p.data[1]} ${unit}`
      }
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'time',
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      max: max
    },
    series: [{
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: data.map(d => [d.timestamp, d.value.toFixed(2)]),
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' }
          ]
        }
      },
      itemStyle: { color }
    }]
  }
}

const temperatureOption = computed(() =>
  generateLineOption(realtimeData.value.temperature, '#F56C6C', '°C', 100)
)

const vibrationOption = computed(() =>
  generateLineOption(realtimeData.value.vibration, '#E6A23C', 'mm/s', 10)
)

const pressureOption = computed(() =>
  generateLineOption(realtimeData.value.pressure, '#409EFF', 'MPa', 1)
)

const currentOption = computed(() =>
  generateLineOption(realtimeData.value.current, '#67C23A', 'A', 40)
)
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  margin-right: 6px;
  animation: pulse 1.5s infinite;
}

.dot.active {
  background: #67c23a;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

.metric-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  border-top: 3px solid;
}

.metric-card.temperature { border-color: #F56C6C; }
.metric-card.vibration { border-color: #E6A23C; }
.metric-card.pressure { border-color: #409EFF; }
.metric-card.current { border-color: #67C23A; }

.metric-card.temperature .metric-header { color: #F56C6C; }
.metric-card.vibration .metric-header { color: #E6A23C; }
.metric-card.pressure .metric-header { color: #409EFF; }
.metric-card.current .metric-header { color: #67C23A; }

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.metric-body {
  margin-bottom: 16px;
}

.metric-body .value {
  font-size: 36px;
  font-weight: 600;
  color: #303133;
}

.metric-body .value.warning {
  color: #F56C6C;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.metric-body .unit {
  font-size: 14px;
  color: #909399;
  margin-left: 6px;
}

.metric-footer {
  font-size: 12px;
  color: #909399;
}

.metric-footer :deep(.el-progress) {
  margin-top: 8px;
}
</style>
