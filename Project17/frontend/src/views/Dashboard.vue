<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statCards" :key="stat.key">
        <div class="stat-header">
          <div class="stat-icon" :style="{ background: stat.bgColor }">
            <el-icon :size="24" :color="stat.iconColor"><component :is="stat.icon" /></el-icon>
          </div>
          <span class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'" v-if="stat.trend">
            <el-icon><component :is="stat.trend > 0 ? 'Top' : 'Bottom'" /></el-icon>
            {{ Math.abs(stat.trend) }}%
          </span>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <div class="chart-card">
          <h3 class="chart-title">交易趋势</h3>
          <v-chart class="chart" :option="transactionChartOption" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <h3 class="chart-title">风险分布</h3>
          <v-chart class="chart" :option="riskPieOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">欺诈类型分布</h3>
          <v-chart class="chart" :option="fraudTypeOption" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">高风险用户排行</h3>
          <v-chart class="chart" :option="topUsersOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">最新预警</h3>
          <el-table :data="recentAlerts" style="width: 100%" size="small">
            <el-table-column prop="alert_id" label="预警ID" width="160" />
            <el-table-column prop="risk_level" label="风险等级" width="100">
              <template #default="{ row }">
                <span class="risk-badge" :class="'risk-' + row.risk_level">
                  {{ getRiskLabel(row.risk_level) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="risk_score" label="风险评分" width="100" />
            <el-table-column prop="description" label="描述" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">最新交易</h3>
          <el-table :data="recentTransactions" style="width: 100%" size="small">
            <el-table-column prop="transaction_id" label="交易ID" width="160" />
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="risk_score" label="风险评分" width="100">
              <template #default="{ row }">
                <span :style="{ color: getRiskColor(row.risk_score) }">
                  {{ row.risk_score.toFixed(1) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as dashboardApi from '@/api/dashboard'
import {
  Money,
  Warning,
  Document,
  User,
  TrendCharts,
  Top,
  Bottom
} from '@element-plus/icons-vue'

const stats = ref(null)
const transactionChartData = ref([])
const riskDistribution = ref([])
const fraudTypes = ref([])
const topFraudUsers = ref([])
const recentAlerts = ref([])
const recentTransactions = ref([])

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    {
      key: 'total',
      label: '总交易数',
      value: stats.value.total_transactions.toLocaleString(),
      icon: 'Money',
      bgColor: '#ecf5ff',
      iconColor: '#409eff',
      trend: 12.5
    },
    {
      key: 'today',
      label: '今日交易',
      value: stats.value.today_transactions.toLocaleString(),
      icon: 'TrendCharts',
      bgColor: '#f0f9eb',
      iconColor: '#67c23a',
      trend: 8.3
    },
    {
      key: 'fraud',
      label: '欺诈交易数',
      value: stats.value.total_fraud.toLocaleString(),
      icon: 'Warning',
      bgColor: '#fef0f0',
      iconColor: '#f56c6c',
      trend: -5.2
    },
    {
      key: 'fraudRate',
      label: '欺诈率',
      value: stats.value.fraud_rate + '%',
      icon: 'TrendCharts',
      bgColor: '#fdf6ec',
      iconColor: '#e6a23c',
      trend: -2.1
    },
    {
      key: 'alerts',
      label: '待处理预警',
      value: stats.value.pending_alerts.toLocaleString(),
      icon: 'Bell',
      bgColor: '#fef0f0',
      iconColor: '#f56c6c',
      trend: 3.7
    },
    {
      key: 'cases',
      label: '待处理案件',
      value: stats.value.open_cases.toLocaleString(),
      icon: 'Document',
      bgColor: '#f4f4f5',
      iconColor: '#909399',
      trend: -10.5
    }
  ]
})

const transactionChartOption = computed(() => {
  const dates = transactionChartData.value.map(item => item.date)
  const counts = transactionChartData.value.map(item => item.count)
  const fraudCounts = transactionChartData.value.map(item => item.fraud_count)

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['交易数', '欺诈数']
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
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '交易数',
        type: 'line',
        smooth: true,
        data: counts,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        }
      },
      {
        name: '欺诈数',
        type: 'line',
        smooth: true,
        data: fraudCounts,
        itemStyle: { color: '#f56c6c' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
            ]
          }
        }
      }
    ]
  }
})

const riskPieOption = computed(() => {
  const data = riskDistribution.value.map(item => ({
    name: item.label,
    value: item.count,
    itemStyle: { color: item.color }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '风险等级',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
})

const fraudTypeOption = computed(() => {
  const types = fraudTypes.value.map(item => item.type)
  const counts = fraudTypes.value.map(item => item.count)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: types,
      axisLabel: {
        rotate: 20
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#f56c6c' },
              { offset: 1, color: '#e6a23c' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '50%'
      }
    ]
  }
})

const topUsersOption = computed(() => {
  const users = topFraudUsers.value.map(item => item.user_id).reverse()
  const amounts = topFraudUsers.value.map(item => item.fraud_amount).reverse()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        return params[0].name + '<br/>欺诈金额: ¥' + params[0].value.toLocaleString()
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: users
    },
    series: [
      {
        name: '欺诈金额',
        type: 'bar',
        data: amounts,
        itemStyle: {
          color: '#f56c6c',
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  }
})

const getRiskLabel = (level) => {
  const labels = {
    critical: '极高',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[level] || level
}

const getRiskColor = (score) => {
  if (score >= 85) return '#f56c6c'
  if (score >= 60) return '#e6a23c'
  if (score >= 30) return '#e6a23c'
  return '#67c23a'
}

const loadData = async () => {
  try {
    const [
      statsRes,
      chartRes,
      riskRes,
      fraudRes,
      usersRes,
      alertsRes,
      transactionsRes
    ] = await Promise.all([
      dashboardApi.getDashboardStats(),
      dashboardApi.getTransactionChart(),
      dashboardApi.getRiskDistribution(),
      dashboardApi.getFraudTypes(),
      dashboardApi.getTopFraudUsers(10),
      dashboardApi.getRecentAlerts(10),
      dashboardApi.getRecentTransactions(10)
    ])

    stats.value = statsRes
    transactionChartData.value = chartRes.data
    riskDistribution.value = riskRes.data
    fraudTypes.value = fraudRes.data
    topFraudUsers.value = usersRes.data
    recentAlerts.value = alertsRes.data
    recentTransactions.value = transactionsRes.data
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-trend.up {
  color: #f56c6c;
}

.stat-trend.down {
  color: #67c23a;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.chart {
  height: 280px;
}
</style>
