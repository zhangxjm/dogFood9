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
          :value="stats.total_devices || 0"
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
          :value="stats.running_devices || 0"
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
          :value="stats.unresolved_alerts || 0"
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
          :value="stats.fault_devices || 0"
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
            <el-table-column prop="device_id" label="设备ID" width="80" />
            <el-table-column prop="alert_type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getAlertTagType(row.level)" size="small">
                  {{ row.alert_type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="预警信息" />
            <el-table-column prop="timestamp" label="时间" width="170">
              <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import StatCard from '@/components/StatCard/index.vue'
import { getDashboardStats, getDeviceStatusOverview, getAlertStats, getRealtimeDataTrend, getRecentAlerts } from '@/api/dashboard'

const router = useRouter()
const dataType = ref('temperature')
const stats = reactive({
  total_devices: 0,
  running_devices: 0,
  unresolved_alerts: 0,
  fault_devices: 0
})
const recentAlerts = ref([])
const statusDistribution = ref([])
const alertDistribution = ref([])
const trendData = ref([])

onMounted(() => {
  loadData()
})

async function loadData() {
  try {
    const [statsRes, statusRes, alertsDistRes, trendRes, alertsRes] = await Promise.all([
      getDashboardStats().catch(() => null),
      getDeviceStatusOverview().catch(() => null),
      getAlertStats().catch(() => null),
      getRealtimeDataTrend({ device_id: 1, hours: 24 }).catch(() => null),
      getRecentAlerts({ page: 1, pageSize: 5 }).catch(() => null)
    ])
    if (statsRes?.data) Object.assign(stats, statsRes.data)
    if (statusRes?.data) statusDistribution.value = statusRes.data
    if (alertsDistRes?.data) alertDistribution.value = alertsDistRes.data
    if (trendRes?.data?.data) trendData.value = trendRes.data.data
    if (alertsRes?.data?.list) recentAlerts.value = alertsRes.data.list
  } catch (e) {
    ElMessage.error('加载仪表盘数据失败')
  }
}

function refreshData() {
  loadData()
}

function goToAlerts() {
  router.push('/alerts')
}

function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const fieldMap = {
  temperature: 'temp',
  vibration: 'vibration',
  pressure: 'pressure',
  current: 'current'
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

const trendChartOption = computed(() => {
  const field = fieldMap[dataType.value]
  const xData = trendData.value.map(d => {
    const dt = new Date(d.timestamp)
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  })
  const yData = trendData.value.map(d => d[field])

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
      data: yData,
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

const statusColorMap = {
  '运行中': '#67C23A',
  '待机': '#909399',
  '故障': '#F56C6C',
  '维护中': '#E6A23C'
}

const statusChartOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: 10, top: 'center' },
  series: [{
    type: 'pie',
    radius: ['45%', '70%'],
    center: ['35%', '50%'],
    avoidLabelOverlap: false,
    label: { show: false },
    data: statusDistribution.value.map(item => ({
      value: item.count,
      name: item.status,
      itemStyle: { color: statusColorMap[item.status] || '#909399' }
    }))
  }]
}))

const alertChartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 50, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: alertDistribution.value.map(d => d.alert_type)
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '预警数量',
      type: 'bar',
      data: alertDistribution.value.map(d => d.count),
      itemStyle: { color: '#E6A23C' },
      barWidth: 40,
      label: { show: true, position: 'top' }
    }
  ]
}))

function getAlertTagType(level) {
  const map = { critical: 'danger', warning: 'warning', info: 'info' }
  return map[level] || 'info'
}
</script>
