<template>
  <div class="dashboard">
    <div class="page-header">
      <h2 class="page-title">数据概览</h2>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <StatCard
          title="设备总数"
          :value="stats.totalDevices || 0"
          icon="Monitor"
          bgColor="#ecf5ff"
          iconColor="#409EFF"
          sub-text="在线运行"
          sub-trend="down"
        />
      </el-col>
      <el-col :span="6">
        <StatCard
          title="运行中"
          :value="stats.runningDevices || 0"
          icon="CircleCheck"
          bgColor="#f0f9eb"
          iconColor="#67C23A"
          sub-text="占比 75%"
          sub-trend="down"
        />
      </el-col>
      <el-col :span="6">
        <StatCard
          title="待处理预警"
          :value="stats.pendingAlerts || 0"
          icon="Warning"
          bgColor="#fdf6ec"
          iconColor="#E6A23C"
          sub-text="较昨日 +3"
          sub-trend="up"
        />
      </el-col>
      <el-col :span="6">
        <StatCard
          title="故障设备"
          :value="stats.faultDevices || 0"
          icon="CircleClose"
          bgColor="#fef0f0"
          iconColor="#F56C6C"
          sub-text="需立即处理"
          sub-trend="up"
        />
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="16">
        <div class="chart-container">
          <div class="flex-between mb-16">
            <h3 class="chart-title">实时数据趋势</h3>
            <el-radio-group v-model="dataType" size="small">
              <el-radio-button value="temperature">温度</el-radio-button>
              <el-radio-button value="vibration">振动</el-radio-button>
              <el-radio-button value="pressure">压力</el-radio-button>
              <el-radio-button value="current">电流</el-radio-button>
            </el-radio-group>
          </div>
          <v-chart :option="trendChartOption" style="height: 320px" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-container" style="height: 368px">
          <h3 class="chart-title">设备状态分布</h3>
          <v-chart :option="statusChartOption" style="height: 300px" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="chart-container">
          <h3 class="chart-title">故障预警统计</h3>
          <v-chart :option="alertChartOption" style="height: 300px" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="flex-between mb-16">
            <h3 class="chart-title">最近预警</h3>
            <el-button type="primary" link @click="goToAlerts">查看全部</el-button>
          </div>
          <el-table :data="recentAlerts" style="width: 100%">
            <el-table-column prop="deviceName" label="设备名称" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getAlertTagType(row.level)" size="small">
                  {{ getAlertLevelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="预警信息" />
            <el-table-column prop="time" label="时间" width="160" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '@/components/StatCard/index.vue'
import { getDashboardStats, getDeviceStatusOverview, getRecentAlerts } from '@/api/dashboard'

const router = useRouter()
const dataType = ref('temperature')
const stats = reactive({
  totalDevices: 48,
  runningDevices: 36,
  pendingAlerts: 8,
  faultDevices: 3
})
const recentAlerts = ref([])

onMounted(() => {
  loadData()
})

async function loadData() {
  try {
    const [statsRes, statusRes, alertsRes] = await Promise.all([
      getDashboardStats().catch(() => null),
      getDeviceStatusOverview().catch(() => null),
      getRecentAlerts({ limit: 5 }).catch(() => null)
    ])
    if (statsRes?.data) Object.assign(stats, statsRes.data)
    if (alertsRes?.data) recentAlerts.value = alertsRes.data
  } catch (e) {
    generateMockData()
  }
}

function generateMockData() {
  recentAlerts.value = [
    { deviceName: '电机A-01', level: 'critical', type: '温度过高', message: '温度超过阈值 95°C', time: '2024-01-15 14:32:15' },
    { deviceName: '泵B-03', level: 'warning', type: '振动异常', message: '振动值达到警戒值', time: '2024-01-15 14:28:42' },
    { deviceName: '压缩机C-02', level: 'info', type: '压力波动', message: '压力波动范围较大', time: '2024-01-15 14:15:33' },
    { deviceName: '电机A-05', level: 'warning', type: '电流异常', message: '电流值超出正常范围', time: '2024-01-15 13:58:21' },
    { deviceName: '泵B-01', level: 'critical', type: '设备停机', message: '设备意外停机', time: '2024-01-15 13:42:10' }
  ]
}

function refreshData() {
  loadData()
}

function goToAlerts() {
  router.push('/alerts')
}

const trendChartOption = computed(() => {
  const xData = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const generateData = (base, range) => xData.map(() => (base + (Math.random() - 0.5) * range).toFixed(2))
  const dataMap = {
    temperature: generateData(70, 20),
    vibration: generateData(5, 2),
    pressure: generateData(0.6, 0.3),
    current: generateData(25, 10)
  }
  const unitMap = {
    temperature: '°C',
    vibration: 'mm/s',
    pressure: 'MPa',
    current: 'A'
  }
  const nameMap = {
    temperature: '温度',
    vibration: '振动',
    pressure: '压力',
    current: '电流'
  }
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: unitMap[dataType.value]
    },
    series: [{
      name: nameMap[dataType.value],
      type: 'line',
      smooth: true,
      data: dataMap[dataType.value],
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      },
      lineStyle: { color: '#409EFF', width: 2 },
      itemStyle: { color: '#409EFF' }
    }]
  }
})

const statusChartOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: 10, top: 'center' },
  series: [{
    type: 'pie',
    radius: ['45%', '70%'],
    center: ['35%', '50%'],
    avoidLabelOverlap: false,
    label: { show: false },
    data: [
      { value: 36, name: '运行中', itemStyle: { color: '#67C23A' } },
      { value: 6, name: '待机', itemStyle: { color: '#909399' } },
      { value: 3, name: '故障', itemStyle: { color: '#F56C6C' } },
      { value: 3, name: '维护中', itemStyle: { color: '#E6A23C' } }
    ]
  }]
}))

const alertChartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 50, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value' },
  series: [
    { name: '严重', type: 'bar', stack: 'total', data: [2, 1, 3, 2, 4, 1, 2], itemStyle: { color: '#F56C6C' } },
    { name: '警告', type: 'bar', stack: 'total', data: [5, 4, 6, 3, 5, 2, 4], itemStyle: { color: '#E6A23C' } },
    { name: '提示', type: 'bar', stack: 'total', data: [8, 6, 9, 7, 10, 5, 7], itemStyle: { color: '#409EFF' } }
  ]
}))

function getAlertLevelText(level) {
  const map = { critical: '严重', warning: '警告', info: '提示' }
  return map[level] || '未知'
}

function getAlertTagType(level) {
  const map = { critical: 'danger', warning: 'warning', info: 'info' }
  return map[level] || 'info'
}
</script>
