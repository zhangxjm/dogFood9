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
              <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="待处理" value="pending" />
                <el-option label="处理中" value="processing" />
                <el-option label="已处理" value="resolved" />
              </el-select>
            </el-form-item>
            <el-form-item label="设备名称">
              <el-input v-model="searchForm.deviceName" placeholder="请输入设备名称" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAlertList">
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
            <el-table-column prop="code" label="预警编号" width="120" />
            <el-table-column prop="deviceName" label="设备名称" width="140" />
            <el-table-column prop="level" label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.level)" size="small" effect="dark">
                  {{ getLevelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="预警类型" width="120" />
            <el-table-column prop="message" label="预警信息" show-overflow-tooltip />
            <el-table-column prop="value" label="当前值" width="100" />
            <el-table-column prop="threshold" label="阈值" width="100" />
            <el-table-column prop="status" label="处理状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="预警时间" width="160" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewDetail(row)" v-if="row.status !== 'resolved'">处理</el-button>
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
              @size-change="loadAlertList"
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
                <el-table-column prop="deviceName" label="设备名称" width="150" />
                <el-table-column prop="type" label="设备类型" width="100" />
                <el-table-column prop="riskLevel" label="风险等级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRiskTagType(row.riskLevel)" size="small" effect="dark">
                      {{ row.riskLevel }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="healthScore" label="健康得分" width="120">
                  <template #default="{ row }">
                    <el-progress
                      :percentage="row.healthScore"
                      :color="row.healthScore > 70 ? '#67C23A' : row.healthScore > 40 ? '#E6A23C' : '#F56C6C'"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="predictedFailure" label="预计故障时间" width="150" />
                <el-table-column prop="suggestion" label="建议措施" />
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button type="primary" link>安排维护</el-button>
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
        <el-descriptions-item label="预警编号">{{ currentAlert.code }}</el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <el-tag :type="getLevelTagType(currentAlert.level)" effect="dark">
            {{ getLevelText(currentAlert.level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentAlert.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ currentAlert.type }}</el-descriptions-item>
        <el-descriptions-item label="当前值">{{ currentAlert.value }}</el-descriptions-item>
        <el-descriptions-item label="阈值">{{ currentAlert.threshold }}</el-descriptions-item>
        <el-descriptions-item label="预警时间" :span="2">{{ currentAlert.time }}</el-descriptions-item>
        <el-descriptions-item label="预警信息" :span="2">{{ currentAlert.message }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px" v-if="currentAlert && currentAlert.status !== 'resolved'">
        <h4 style="margin-bottom: 12px">处理信息</h4>
        <el-form label-width="100px">
          <el-form-item label="处理措施">
            <el-input v-model="handleForm.measure" type="textarea" :rows="3" placeholder="请输入处理措施" />
          </el-form-item>
          <el-form-item label="处理结果">
            <el-radio-group v-model="handleForm.result">
              <el-radio value="resolved">已解决</el-radio>
              <el-radio value="processing">处理中</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentAlert && currentAlert.status !== 'resolved'"
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
  status: '',
  deviceName: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const alertStats = reactive({
  critical: 3,
  warning: 12,
  info: 25,
  pending: 8
})

const alertList = ref([])

const handleForm = reactive({
  measure: '',
  result: 'resolved'
})

const highRiskDevices = ref([
  { deviceName: '电机A-01', type: '电机', riskLevel: '高', healthScore: 35, predictedFailure: '约15天内', suggestion: '立即停机检修，更换轴承' },
  { deviceName: '泵B-03', type: '泵', riskLevel: '中', healthScore: 58, predictedFailure: '约30天内', suggestion: '近期安排维护保养' },
  { deviceName: '压缩机C-02', type: '压缩机', riskLevel: '高', healthScore: 42, predictedFailure: '约20天内', suggestion: '检查密封件，更换润滑油' },
  { deviceName: '风机D-05', type: '风机', riskLevel: '中', healthScore: 65, predictedFailure: '约45天内', suggestion: '正常监控，下次维护检查' }
])

onMounted(() => {
  loadAlertList()
  loadAlertStats()
})

async function loadAlertList() {
  loading.value = true
  try {
    const res = await getAlertList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res?.data) {
      alertList.value = res.data.list || res.data
      pagination.total = res.data.total || res.data.length
    } else {
      generateMockData()
    }
  } catch (e) {
    generateMockData()
  } finally {
    loading.value = false
  }
}

async function loadAlertStats() {
  try {
    const res = await getAlertStats()
    if (res?.data) Object.assign(alertStats, res.data)
  } catch (e) {
  }
}

function generateMockData() {
  const levels = ['critical', 'warning', 'info']
  const statuses = ['pending', 'processing', 'resolved']
  const types = ['温度过高', '振动异常', '压力波动', '电流异常', '设备停机']
  const devices = ['电机A-01', '泵B-03', '压缩机C-02', '风机D-05', '电机A-05']
  const values = ['95°C', '7.2mm/s', '0.95MPa', '35A', '-']
  const thresholds = ['80°C', '6mm/s', '0.8MPa', '30A', '-']

  alertList.value = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    code: `ALT${String(Date.now() + i).slice(-8)}`,
    deviceName: devices[i % 5],
    level: levels[i % 3],
    type: types[i % 5],
    message: `${types[i % 5]}，需要及时处理`,
    value: values[i % 5],
    threshold: thresholds[i % 5],
    status: statuses[i % 3],
    time: `2024-01-${String(15 - Math.floor(i / 3)).padStart(2, '0')} ${String(14 - i).padStart(2, '0')}:${String(30 + i * 2).padStart(2, '0')}:00`
  }))
  pagination.total = 45
}

function resetSearch() {
  searchForm.level = ''
  searchForm.status = ''
  searchForm.deviceName = ''
  pagination.page = 1
  loadAlertList()
}

function viewDetail(row) {
  currentAlert.value = row
  handleForm.measure = ''
  handleForm.result = 'resolved'
  detailDialogVisible.value = true
}

async function submitHandle() {
  try {
    await handleAlert(currentAlert.value.id, handleForm)
    ElMessage.success('处理成功')
  } catch (e) {
    const idx = alertList.value.findIndex(a => a.id === currentAlert.value.id)
    if (idx > -1) {
      alertList.value[idx].status = handleForm.result
    }
    ElMessage.success('处理成功')
  }
  detailDialogVisible.value = false
  loadAlertList()
  loadAlertStats()
}

const healthOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 50, right: 20, top: 30, bottom: 40 },
  xAxis: {
    type: 'category',
    data: ['电机A-01', '泵B-03', '压缩机C-02', '风机D-05', '电机A-05', '泵B-01'],
    axisLabel: { rotate: 30 }
  },
  yAxis: {
    type: 'value',
    max: 100,
    name: '健康得分'
  },
  series: [{
    type: 'bar',
    data: [
      { value: 35, itemStyle: { color: '#F56C6C' } },
      { value: 58, itemStyle: { color: '#E6A23C' } },
      { value: 42, itemStyle: { color: '#F56C6C' } },
      { value: 65, itemStyle: { color: '#E6A23C' } },
      { value: 88, itemStyle: { color: '#67C23A' } },
      { value: 76, itemStyle: { color: '#67C23A' } }
    ],
    barWidth: 40,
    label: { show: true, position: 'top' }
  }]
}))

const predictionOption = computed(() => {
  const xData = Array.from({ length: 14 }, (_, i) => `第${i + 1}天`)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['预测故障率', '历史故障率'] },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value', name: '故障率(%)', max: 10 },
    series: [
      {
        name: '历史故障率',
        type: 'line',
        smooth: true,
        data: [2.1, 2.3, 2.5, 2.8, 3.1, 3.5, 3.8, 4.2, null, null, null, null, null, null],
        lineStyle: { color: '#409EFF' },
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '预测故障率',
        type: 'line',
        smooth: true,
        lineStyle: { type: 'dashed', color: '#F56C6C' },
        itemStyle: { color: '#F56C6C' },
        data: [null, null, null, null, null, null, null, 4.2, 4.8, 5.5, 6.3, 7.2, 8.5, 9.8],
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
  }
})

function getLevelText(level) {
  const map = { critical: '严重', warning: '警告', info: '提示' }
  return map[level] || level
}

function getLevelTagType(level) {
  const map = { critical: 'danger', warning: 'warning', info: 'info' }
  return map[level] || 'info'
}

function getStatusText(status) {
  const map = { pending: '待处理', processing: '处理中', resolved: '已处理' }
  return map[status] || status
}

function getStatusTagType(status) {
  const map = { pending: 'warning', processing: 'primary', resolved: 'success' }
  return map[status] || 'info'
}

function getRiskTagType(risk) {
  const map = { '高': 'danger', '中': 'warning', '低': 'success' }
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
