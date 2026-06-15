<template>
  <div class="cases-page">
    <div class="page-header">
      <h2 class="page-title">案例分析</h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="stat in caseStats" :key="stat.key">
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <div class="card-shadow" style="background: #fff; padding: 20px; border-radius: 8px; margin-top: 20px;">
      <div class="filter-group">
        <el-select
          v-model="filters.case_status"
          placeholder="案件状态"
          style="width: 150px"
          clearable
        >
          <el-option label="待处理" value="open" />
          <el-option label="调查中" value="investigating" />
          <el-option label="已结案" value="closed" />
        </el-select>
        <el-select
          v-model="filters.severity"
          placeholder="严重程度"
          style="width: 150px"
          clearable
        >
          <el-option label="极高" value="critical" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button type="primary" @click="loadCases">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="cases" style="width: 100%; margin-top: 20px;" v-loading="loading">
        <el-table-column prop="case_id" label="案件ID" width="180" />
        <el-table-column prop="transaction_id" label="交易ID" width="180" />
        <el-table-column prop="case_type" label="案件类型" width="150" />
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <span class="risk-badge" :class="'risk-' + row.severity">
              {{ getSeverityLabel(row.severity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="case_status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.case_status)" size="small">
              {{ getStatusLabel(row.case_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="analyst" label="分析师" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="warning" link @click="editCase(row)">处理</el-button>
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
          @size-change="loadCases"
          @current-change="loadCases"
        />
      </div>
    </div>

    <el-dialog v-model="showDetailDialog" title="案件详情" width="700px">
      <el-descriptions :column="2" border v-if="selectedCase">
        <el-descriptions-item label="案件ID">{{ selectedCase.case_id }}</el-descriptions-item>
        <el-descriptions-item label="交易ID">{{ selectedCase.transaction_id }}</el-descriptions-item>
        <el-descriptions-item label="案件类型">{{ selectedCase.case_type }}</el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <span class="risk-badge" :class="'risk-' + selectedCase.severity">
            {{ getSeverityLabel(selectedCase.severity) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="案件状态">
          <el-tag :type="getStatusType(selectedCase.case_status)" size="small">
            {{ getStatusLabel(selectedCase.case_status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分析师">{{ selectedCase.analyst || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedCase.description }}</el-descriptions-item>
        <el-descriptions-item label="调查笔记" :span="2">
          {{ selectedCase.investigation_notes || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="结论" :span="2">{{ selectedCase.conclusion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedCase.created_at }}</el-descriptions-item>
        <el-descriptions-item label="结案时间">{{ selectedCase.closed_at || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showEditDialog" title="处理案件" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="案件状态">
          <el-select v-model="editForm.case_status" style="width: 100%">
            <el-option label="待处理" value="open" />
            <el-option label="调查中" value="investigating" />
            <el-option label="已结案" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="editForm.severity" style="width: 100%">
            <el-option label="极高" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="分析师">
          <el-input v-model="editForm.analyst" placeholder="请输入分析师" />
        </el-form-item>
        <el-form-item label="调查笔记">
          <el-input v-model="editForm.investigation_notes" type="textarea" :rows="4" placeholder="请输入调查笔记" />
        </el-form-item>
        <el-form-item label="结论">
          <el-input v-model="editForm.conclusion" type="textarea" :rows="3" placeholder="请输入结论" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as caseApi from '@/api/cases'

const loading = ref(false)
const cases = ref([])
const caseStatsData = ref(null)
const selectedCase = ref(null)
const showDetailDialog = ref(false)
const showEditDialog = ref(false)
const currentCaseId = ref('')

const filters = reactive({
  case_status: '',
  severity: '',
  analyst: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const editForm = reactive({
  case_status: '',
  severity: '',
  analyst: '',
  investigation_notes: '',
  conclusion: ''
})

const caseStats = computed(() => {
  if (!caseStatsData.value) return []
  return [
    { key: 'total', label: '总案件数', value: caseStatsData.value.total, color: '#303133' },
    { key: 'open', label: '待处理', value: caseStatsData.value.by_status.open, color: '#e6a23c' },
    { key: 'investigating', label: '调查中', value: caseStatsData.value.by_status.investigating, color: '#409eff' },
    { key: 'closed', label: '已结案', value: caseStatsData.value.by_status.closed, color: '#67c23a' }
  ]
})

const getSeverityLabel = (severity) => {
  const labels = {
    critical: '极高',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[severity] || severity
}

const getStatusLabel = (status) => {
  const labels = {
    open: '待处理',
    investigating: '调查中',
    closed: '已结案'
  }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = {
    open: 'warning',
    investigating: 'primary',
    closed: 'success'
  }
  return types[status] || 'info'
}

const loadCases = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...filters
    }
    if (!params.case_status) delete params.case_status
    if (!params.severity) delete params.severity
    if (!params.analyst) delete params.analyst

    const res = await caseApi.getCases(params)
    cases.value = res.items
    pagination.total = res.total
  } catch (error) {
    console.error('Failed to load cases:', error)
  } finally {
    loading.value = false
  }
}

const loadCaseStats = async () => {
  try {
    const res = await caseApi.getCaseStats()
    caseStatsData.value = res
  } catch (error) {
    console.error('Failed to load case stats:', error)
  }
}

const resetFilters = () => {
  filters.case_status = ''
  filters.severity = ''
  filters.analyst = ''
  pagination.page = 1
  loadCases()
}

const viewDetail = (row) => {
  selectedCase.value = row
  showDetailDialog.value = true
}

const editCase = (row) => {
  currentCaseId.value = row.case_id
  editForm.case_status = row.case_status
  editForm.severity = row.severity
  editForm.analyst = row.analyst || ''
  editForm.investigation_notes = row.investigation_notes || ''
  editForm.conclusion = row.conclusion || ''
  showEditDialog.value = true
}

const submitEdit = async () => {
  try {
    await caseApi.updateCase(currentCaseId.value, editForm)
    ElMessage.success('保存成功')
    showEditDialog.value = false
    loadCases()
    loadCaseStats()
  } catch (error) {
    console.error('Failed to update case:', error)
  }
}

onMounted(() => {
  loadCases()
  loadCaseStats()
})
</script>

<style scoped>
.cases-page {
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
