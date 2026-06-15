<template>
  <div class="alerts-page">
    <div class="page-header">
      <h2 class="page-title">风险预警</h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="stat in alertStats" :key="stat.key">
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <div class="card-shadow" style="background: #fff; padding: 20px; border-radius: 8px; margin-top: 20px;">
      <div class="filter-group">
        <el-select
          v-model="filters.risk_level"
          placeholder="风险等级"
          style="width: 150px"
          clearable
        >
          <el-option label="极高风险" value="critical" />
          <el-option label="高风险" value="high" />
          <el-option label="中等风险" value="medium" />
          <el-option label="低风险" value="low" />
        </el-select>
        <el-select
          v-model="filters.is_handled"
          placeholder="处理状态"
          style="width: 150px"
          clearable
        >
          <el-option label="待处理" :value="false" />
          <el-option label="已处理" :value="true" />
        </el-select>
        <el-select
          v-model="filters.alert_type"
          placeholder="预警类型"
          style="width: 150px"
          clearable
        >
          <el-option label="风险检测" value="risk_detection" />
          <el-option label="欺诈嫌疑" value="fraud_suspected" />
        </el-select>
        <el-button type="primary" @click="loadAlerts">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="alerts" style="width: 100%; margin-top: 20px;" v-loading="loading">
        <el-table-column prop="alert_id" label="预警ID" width="180" />
        <el-table-column prop="transaction_id" label="交易ID" width="180" />
        <el-table-column prop="risk_level" label="风险等级" width="100">
          <template #default="{ row }">
            <span class="risk-badge" :class="'risk-' + row.risk_level">
              {{ getRiskLabel(row.risk_level) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="risk_score" label="风险评分" width="100" />
        <el-table-column prop="alert_type" label="预警类型" width="120">
          <template #default="{ row }">
            {{ getAlertTypeLabel(row.alert_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="rule_triggered" label="触发规则" width="150" show-overflow-tooltip />
        <el-table-column prop="is_handled" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_handled ? 'success' : 'warning'" size="small">
              {{ row.is_handled ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handled_by" label="处理人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.is_handled" size="small" type="primary" link @click="handleAlert(row)">
              处理
            </el-button>
            <el-button size="small" type="info" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadAlerts"
          @current-change="loadAlerts"
        />
      </div>
    </div>

    <el-dialog v-model="showHandleDialog" title="处理预警" width="500px">
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="处理人">
          <el-input v-model="handleForm.handled_by" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.handle_notes" type="textarea" :rows="4" placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="预警详情" width="600px">
      <el-descriptions :column="2" border v-if="selectedAlert">
        <el-descriptions-item label="预警ID">{{ selectedAlert.alert_id }}</el-descriptions-item>
        <el-descriptions-item label="交易ID">{{ selectedAlert.transaction_id }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <span class="risk-badge" :class="'risk-' + selectedAlert.risk_level">
            {{ getRiskLabel(selectedAlert.risk_level) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="风险评分">{{ selectedAlert.risk_score }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ getAlertTypeLabel(selectedAlert.alert_type) }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="selectedAlert.is_handled ? 'success' : 'warning'" size="small">
            {{ selectedAlert.is_handled ? '已处理' : '待处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="触发规则">{{ selectedAlert.rule_triggered || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ selectedAlert.handled_by || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedAlert.description }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">{{ selectedAlert.handle_notes || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedAlert.created_at }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ selectedAlert.handled_at || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as alertApi from '@/api/alerts'

const loading = ref(false)
const alerts = ref([])
const alertStatsData = ref(null)
const selectedAlert = ref(null)
const showHandleDialog = ref(false)
const showDetailDialog = ref(false)
const currentAlertId = ref('')

const filters = reactive({
  risk_level: '',
  is_handled: null,
  alert_type: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const handleForm = reactive({
  handled_by: 'admin',
  handle_notes: ''
})

const alertStats = computed(() => {
  if (!alertStatsData.value) return []
  return [
    { key: 'total', label: '总预警数', value: alertStatsData.value.total, color: '#303133' },
    { key: 'pending', label: '待处理', value: alertStatsData.value.pending, color: '#e6a23c' },
    { key: 'critical', label: '极高风险', value: alertStatsData.value.by_level.critical, color: '#f56c6c' },
    { key: 'high', label: '高风险', value: alertStatsData.value.by_level.high, color: '#e6a23c' }
  ]
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

const getAlertTypeLabel = (type) => {
  const labels = {
    risk_detection: '风险检测',
    fraud_suspected: '欺诈嫌疑'
  }
  return labels[type] || type
}

const loadAlerts = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...filters
    }
    if (!params.risk_level) delete params.risk_level
    if (params.is_handled === null || params.is_handled === '') delete params.is_handled
    if (!params.alert_type) delete params.alert_type

    const res = await alertApi.getAlerts(params)
    alerts.value = res.items
    pagination.total = res.total
  } catch (error) {
    console.error('Failed to load alerts:', error)
  } finally {
    loading.value = false
  }
}

const loadAlertStats = async () => {
  try {
    const res = await alertApi.getAlertStats()
    alertStatsData.value = res
  } catch (error) {
    console.error('Failed to load alert stats:', error)
  }
}

const resetFilters = () => {
  filters.risk_level = ''
  filters.is_handled = null
  filters.alert_type = ''
  pagination.page = 1
  loadAlerts()
}

const handleAlert = (row) => {
  currentAlertId.value = row.alert_id
  handleForm.handled_by = 'admin'
  handleForm.handle_notes = ''
  showHandleDialog.value = true
}

const submitHandle = async () => {
  try {
    await alertApi.handleAlert(currentAlertId.value, handleForm)
    ElMessage.success('处理成功')
    showHandleDialog.value = false
    loadAlerts()
    loadAlertStats()
  } catch (error) {
    console.error('Failed to handle alert:', error)
  }
}

const viewDetail = (row) => {
  selectedAlert.value = row
  showDetailDialog.value = true
}

onMounted(() => {
  loadAlerts()
  loadAlertStats()
})
</script>

<style scoped>
.alerts-page {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
