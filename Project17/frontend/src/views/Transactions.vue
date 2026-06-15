<template>
  <div class="transactions-page">
    <div class="page-header">
      <h2 class="page-title">交易管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增交易
      </el-button>
    </div>

    <div class="card-shadow" style="background: #fff; padding: 20px; border-radius: 8px;">
      <div class="filter-group">
        <el-input
          v-model="filters.user_id"
          placeholder="用户ID"
          style="width: 180px"
          clearable
          @clear="loadTransactions"
        />
        <el-select
          v-model="filters.status"
          placeholder="交易状态"
          style="width: 150px"
          clearable
        >
          <el-option label="待处理" value="pending" />
          <el-option label="已完成" value="completed" />
          <el-option label="已标记" value="flagged" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-select
          v-model="filters.risk_level"
          placeholder="风险等级"
          style="width: 150px"
          clearable
        >
          <el-option label="极低风险" value="low" />
          <el-option label="中等风险" value="medium" />
          <el-option label="高风险" value="high" />
          <el-option label="极高风险" value="critical" />
        </el-select>
        <el-switch
          v-model="filters.is_fraud"
          active-text="仅欺诈"
          style="margin-left: 10px"
        />
        <el-button type="primary" @click="loadTransactions">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="transactions" style="width: 100%; margin-top: 20px;" v-loading="loading">
        <el-table-column prop="transaction_id" label="交易ID" width="180" />
        <el-table-column prop="user_id" label="用户ID" width="120" />
        <el-table-column prop="merchant_id" label="商户ID" width="140" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span style="color: #303133; font-weight: 500;">
              ¥{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="transaction_type" label="交易类型" width="100">
          <template #default="{ row }">
            {{ getTypeLabel(row.transaction_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="risk_score" label="风险评分" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round(row.risk_score)"
              :color="getProgressColor(row.risk_score)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_fraud" label="是否欺诈" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_fraud ? 'danger' : 'success'" size="small">
              {{ row.is_fraud ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="warning" link @click="detectFraud(row)">风险检测</el-button>
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
          @size-change="loadTransactions"
          @current-change="loadTransactions"
        />
      </div>
    </div>

    <el-dialog v-model="showDetailDialog" title="交易详情" width="600px">
      <el-descriptions :column="2" border v-if="selectedTransaction">
        <el-descriptions-item label="交易ID">{{ selectedTransaction.transaction_id }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ selectedTransaction.user_id }}</el-descriptions-item>
        <el-descriptions-item label="商户ID">{{ selectedTransaction.merchant_id }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ selectedTransaction.amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="交易类型">{{ getTypeLabel(selectedTransaction.transaction_type) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusLabel(selectedTransaction.status) }}</el-descriptions-item>
        <el-descriptions-item label="风险评分">
          <span :style="{ color: getRiskColor(selectedTransaction.risk_score), fontWeight: 'bold' }">
            {{ selectedTransaction.risk_score.toFixed(1) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="是否欺诈">
          <el-tag :type="selectedTransaction.is_fraud ? 'danger' : 'success'" size="small">
            {{ selectedTransaction.is_fraud ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="欺诈类型">{{ selectedTransaction.fraud_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ selectedTransaction.ip_address }}</el-descriptions-item>
        <el-descriptions-item label="设备ID">{{ selectedTransaction.device_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ selectedTransaction.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedTransaction.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ selectedTransaction.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showCreateDialog" title="新增交易" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="formData.user_id" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="商户ID">
          <el-input v-model="formData.merchant_id" placeholder="请输入商户ID" />
        </el-form-item>
        <el-form-item label="交易金额">
          <el-input-number v-model="formData.amount" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="交易类型">
          <el-select v-model="formData.transaction_type" style="width: 100%">
            <el-option label="转账" value="transfer" />
            <el-option label="支付" value="payment" />
            <el-option label="提现" value="withdrawal" />
            <el-option label="充值" value="deposit" />
            <el-option label="退款" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input v-model="formData.ip_address" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="设备ID">
          <el-input v-model="formData.device_id" placeholder="请输入设备ID（可选）" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="formData.location" placeholder="请输入地点（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as transactionApi from '@/api/transactions'

const loading = ref(false)
const transactions = ref([])
const selectedTransaction = ref(null)
const showDetailDialog = ref(false)
const showCreateDialog = ref(false)

const filters = reactive({
  user_id: '',
  status: '',
  risk_level: '',
  is_fraud: false
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const formData = reactive({
  user_id: '',
  merchant_id: '',
  amount: 1000,
  transaction_type: 'payment',
  ip_address: '192.168.1.1',
  device_id: '',
  location: '',
  description: ''
})

const getTypeLabel = (type) => {
  const labels = {
    transfer: '转账',
    payment: '支付',
    withdrawal: '提现',
    deposit: '充值',
    refund: '退款'
  }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '待处理',
    completed: '已完成',
    flagged: '已标记',
    rejected: '已拒绝'
  }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    completed: 'success',
    flagged: 'danger',
    rejected: 'info'
  }
  return types[status] || 'info'
}

const getProgressColor = (score) => {
  if (score >= 85) return '#f56c6c'
  if (score >= 60) return '#e6a23c'
  if (score >= 30) return '#e6a23c'
  return '#67c23a'
}

const getRiskColor = (score) => {
  if (score >= 85) return '#f56c6c'
  if (score >= 60) return '#e6a23c'
  if (score >= 30) return '#e6a23c'
  return '#67c23a'
}

const loadTransactions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...filters
    }
    if (!params.user_id) delete params.user_id
    if (!params.status) delete params.status
    if (!params.risk_level) delete params.risk_level
    if (!params.is_fraud) delete params.is_fraud

    const res = await transactionApi.getTransactions(params)
    transactions.value = res.items
    pagination.total = res.total
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.user_id = ''
  filters.status = ''
  filters.risk_level = ''
  filters.is_fraud = false
  pagination.page = 1
  loadTransactions()
}

const viewDetail = (row) => {
  selectedTransaction.value = row
  showDetailDialog.value = true
}

const detectFraud = async (row) => {
  try {
    const res = await transactionApi.detectFraud(row.transaction_id)
    ElMessage.success(`风险评分: ${res.risk_score}, 风险等级: ${getRiskLevelLabel(res.risk_level)}`)
    loadTransactions()
  } catch (error) {
    console.error('Failed to detect fraud:', error)
  }
}

const getRiskLevelLabel = (level) => {
  const labels = {
    critical: '极高风险',
    high: '高风险',
    medium: '中等风险',
    low: '低风险'
  }
  return labels[level] || level
}

const handleCreate = async () => {
  try {
    await transactionApi.createTransaction(formData)
    ElMessage.success('交易创建成功')
    showCreateDialog.value = false
    loadTransactions()
  } catch (error) {
    console.error('Failed to create transaction:', error)
  }
}

onMounted(() => {
  loadTransactions()
})
</script>

<style scoped>
.transactions-page {
  padding: 0;
}
</style>
