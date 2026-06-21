<template>
  <div class="alert-management">
    <div class="page-header">
      <h2 class="page-title">故障预警</h2>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <StatCard
          title="严重预警"
          :value="alertStats.critical || 0"
          icon="CircleClose"
          bgColor="#fef0f0"
          iconColor="#F56C6C"
        />
      </el-col>
      <el-col :span="6">
        <StatCard
          title="警告预警"
          :value="alertStats.warning || 0"
          icon="Warning"
          bgColor="#fdf6ec"
          iconColor="#E6A23C"
        />
      </el-col>
      <el-col :span="6">
        <StatCard
          title="提示预警"
          :value="alertStats.info || 0"
          icon="InfoFilled"
          bgColor="#ecf5ff"
          iconColor="#409EFF"
        />
      </el-col>
      <el-col :span="6">
        <StatCard
          title="待处理"
          :value="alertStats.pending || 0"
          icon="Clock"
          bgColor="#f0f9eb"
          iconColor="#67C23A"
        />
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="预警列表" name="list">
        <div class="card-shadow mb-20" style="padding: 20px">
          <el-form :inline="true" :model="searchForm">
            <el-form-item label="预警级别">
              <el-select v-model="searchForm.level" placeholder="全部" clearable style="width: 140px">
                <el-option label="严重" value="critical" />
                <el-option label="警告" value="warning" />
                <el-option label="提示" value="info" />
              </el-select>
            </el-form-item>
            <el-form-item label="处理状态">
              <el-select v-model="searchForm.is_resolved" placeholder="全部" clearable style="width: 140px">
                <el-option label="待处理" :value="false" />
                <el-option label="已处理" :value="true" />
              </el-select>
            </el-form-item>
            <el-form-item label="设备ID">
              <el-input v-model="searchForm.device_id" placeholder="请输入设备ID" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetSearch">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="card-shadow">
          <el-table :data="alertList" v-loading="loading" style="width: 100%">
            <el-table-column prop="id" label="预警ID" width="80" />
            <el-table-column prop="device_id" label="设备ID" width="80" />
            <el-table-column prop="level" label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.level)" size="small" effect="dark">
                  {{ getLevelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alert_type" label="预警类型" width="120" />
            <el-table-column prop="message" label="预警信息" show-overflow-tooltip />
            <el-table-column prop="value" label="当前值" width="100" />
            <el-table-column prop="threshold" label="阈值" width="100" />
            <el-table-column label="处理状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_resolved ? 'success' : 'warning'" size="small">
                  {{ row.is_resolved ? '已处理' : '待处理' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="预警时间" width="170">
              <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewDetail(row)" v-if="!row.is_resolved">处理</el-button>
                <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
              @current-change="loadAlertList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="故障预测分析" name="prediction">
        <el-row :gutter="20">
          <el-col :span="12" class="mb-20">
            <div class="chart-container">
              <h3 class="chart-title">设备健康度评估</h3>
              <v-chart :option="healthOption" style="height: 320px" autoresize />
            </div>
          </el-col>
          <el-col :span="12" class="mb-20">
            <div class="chart-container">
              <h3 class="chart-title">故障预测趋势</h3>
              <v-chart :option="predictionOption" style="height: 320px" autoresize />
            </div>
          </el-col>
          <el-col :span="24">
            <div class="card-shadow" style="padding: 20px">
              <h3 class="chart-title">高风险设备预警</h3>
              <el-table :data="highRiskDevices" style="width: 100%">
                <el-table-column prop="device_id" label="设备ID" width="100" />
                <el-table-column prop="risk_level" label="风险等级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRiskTagType(row.risk_level)" size="small" effect="dark">
                      {{ row.risk_level }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="fault_probability" label="故障概率" width="120">
                  <template #default="{ row }">
                    <el-progress
                      :percentage="Math.round(row.fault_probability * 100)"
                      :color="row.fault_probability > 0.7 ? '#F56C6C' : row.fault_probability > 0.4 ? '#E6A23C' : '#67C23A'"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="风险因素" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ (row.factors || []).join('、') }}
                  </template>
                </el-table-column>
                <el-table-column label="建议措施" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ (row.recommendations || []).join('、') }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailDialogVisible" title="预警详情" width="600px">
      <el-descriptions :column="2" border v-if="currentAlert">
        <el-descriptions-item label="预警ID">{{ currentAlert.id }}</el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <el-tag :type="getLevelTagType(currentAlert.level)" effect="dark">
            {{ getLevelText(currentAlert.level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备ID">{{ currentAlert.device_id }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ currentAlert.alert_type }}</el-descriptions-item>
        <el-descriptions-item label="当前值">{{ currentAlert.value }}</el-descriptions-item>
        <el-descriptions-item label="阈值">{{ currentAlert.threshold }}</el-descriptions-item>
        <el-descriptions-item label="预警时间" :span="2">{{ formatTime(currentAlert.timestamp) }}</el-descriptions-item>
        <el-descriptions-item label="预警信息" :span="2">{{ currentAlert.message }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px" v-if="currentAlert && !currentAlert.is_resolved">
        <h4 style="margin-bottom: 12px">处理信息</h4>
        <el-form label-width="100px">
          <el-form-item label="处理措施">
            <el-input v-model="handleForm.measure" type="textarea" :rows="3" placeholder="请输入处理措施" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentAlert && !currentAlert.is_resolved"
          type="primary"
          @click="submitHandle"
        >
          提交处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import StatCard from '@/components/StatCard/index.vue'
import { getAlertList, getAlertStats, handleAlert, getPredictionAnalysis } from '@/api/alert'

const activeTab = ref('list')
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentAlert = ref(null)

const searchForm = reactive({
  level: '',
  is_resolved: '',
  device_id: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const alertStats = reactive({
  critical: 0,
  warning: 0,
  info: 0,
  pending: 0
})

const alertList = ref([])

const handleForm = reactive({
  measure: ''
})

const highRiskDevices = ref([])

onMounted(() => {
  loadAlertList()
  loadAlertStats()
  loadPredictions()
})

function handleSizeChange() {
  pagination.page = 1
  loadAlertList()
}

function handleSearch() {
  pagination.page = 1
  loadAlertList()
}

async function loadAlertList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.level) params.level = searchForm.level
    if (searchForm.is_resolved !== '' && searchForm.is_resolved !== null) params.is_resolved = searchForm.is_resolved
    if (searchForm.device_id) params.device_id = searchForm.device_id

    const res = await getAlertList(params)
    if (res?.data) {
      alertList.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('加载预警列表失败')
  } finally {
    loading.value = false
  }
}

async function loadAlertStats() {
  try {
    const res = await getAlertStats()
    if (res?.data) {
      const d = res.data
      alertStats.critical = d.today_alerts || 0
      alertStats.warning = d.unresolved_alerts || 0
      alertStats.pending = d.unresolved_alerts || 0
    }
  } catch (e) {
    ElMessage.error('加载预警统计失败')
  }
}

async function loadPredictions() {
  try {
    const res = await getPredictionAnalysis()
    if (res?.data?.results) {
      highRiskDevices.value = res.data.results
    }
  } catch (e) {
  }
}

function resetSearch() {
  searchForm.level = ''
  searchForm.is_resolved = ''
  searchForm.device_id = ''
  pagination.page = 1
  loadAlertList()
}

function viewDetail(row) {
  currentAlert.value = row
  handleForm.measure = ''
  detailDialogVisible.value = true
}

async function submitHandle() {
  try {
    await handleAlert(currentAlert.value.id, handleForm)
    ElMessage.success('处理成功')
  } catch (e) {
    ElMessage.error('处理失败')
    return
  }
  detailDialogVisible.value = false
  loadAlertList()
  loadAlertStats()
}

function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const healthOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 50, right: 20, top: 30, bottom: 40 },
  xAxis: {
    type: 'category',
    data: highRiskDevices.value.map(d => `设备${d.device_id}`),
    axisLabel: { rotate: 30 }
  },
  yAxis: {
    type: 'value',
    max: 100,
    name: '故障概率(%)'
  },
  series: [{
    type: 'bar',
    data: highRiskDevices.value.map(d => ({
      value: Math.round(d.fault_probability * 100),
      itemStyle: { color: d.fault_probability > 0.7 ? '#F56C6C' : d.fault_probability > 0.4 ? '#E6A23C' : '#67C23A' }
    })),
    barWidth: 40,
    label: { show: true, position: 'top' }
  }]
}))

const predictionOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['故障概率'] },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    data: highRiskDevices.value.map(d => `设备${d.device_id}`)
  },
  yAxis: { type: 'value', name: '故障概率', max: 1 },
  series: [
    {
      name: '故障概率',
      type: 'line',
      smooth: true,
      data: highRiskDevices.value.map(d => d.fault_probability),
      lineStyle: { color: '#F56C6C' },
      itemStyle: { color: '#F56C6C' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
          ]
        }
      }
    }
  ]
}))

function getLevelText(level) {
  const map = { critical: '严重', warning: '警告', info: '提示' }
  return map[level] || level
}

function getLevelTagType(level) {
  const map = { critical: 'danger', warning: 'warning', info: 'info' }
  return map[level] || 'info'
}

function getRiskTagType(risk) {
  const map = { '高': 'danger', '中': 'warning', '低': 'success', high: 'danger', medium: 'warning', low: 'success' }
  return map[risk] || 'info'
}
</script>

<style scoped>
.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
