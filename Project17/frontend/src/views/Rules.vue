<template>
  <div class="rules-page">
    <div class="page-header">
      <h2 class="page-title">规则管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增规则
      </el-button>
    </div>

    <div class="card-shadow" style="background: #fff; padding: 20px; border-radius: 8px;">
      <div class="filter-group">
        <el-select
          v-model="filters.rule_type"
          placeholder="规则类型"
          style="width: 180px"
          clearable
        >
          <el-option
            v-for="type in ruleTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
        <el-select
          v-model="filters.is_enabled"
          placeholder="启用状态"
          style="width: 150px"
          clearable
        >
          <el-option label="已启用" :value="true" />
          <el-option label="已禁用" :value="false" />
        </el-select>
        <el-button type="primary" @click="loadRules">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="rules" style="width: 100%; margin-top: 20px;" v-loading="loading">
        <el-table-column prop="rule_id" label="规则ID" width="160" />
        <el-table-column prop="rule_name" label="规则名称" width="200" />
        <el-table-column prop="rule_type" label="规则类型" width="120">
          <template #default="{ row }">
            {{ getTypeLabel(row.rule_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="rule_expression" label="规则表达式" show-overflow-tooltip />
        <el-table-column prop="risk_score" label="风险分值" width="100" />
        <el-table-column prop="risk_level" label="风险等级" width="100">
          <template #default="{ row }">
            <span class="risk-badge" :class="'risk-' + row.risk_level">
              {{ getLevelLabel(row.risk_level) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="is_enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_enabled ? 'success' : 'info'" size="small">
              {{ row.is_enabled ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="editRule(row)">编辑</el-button>
            <el-button size="small" :type="row.is_enabled ? 'warning' : 'success'" link @click="toggleRule(row)">
              {{ row.is_enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" link @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreateDialog" :title="isEdit ? '编辑规则' : '新增规则'" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="规则名称">
          <el-input v-model="formData.rule_name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="formData.rule_type" style="width: 100%" @change="onRuleTypeChange">
            <el-option
              v-for="type in ruleTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则表达式">
          <el-input
            v-model="formData.rule_expression"
            type="textarea"
            :rows="3"
            placeholder="请输入规则表达式，例如: amount > 50000"
          />
        </el-form-item>
        <el-form-item label="风险分值">
          <el-input-number v-model="formData.risk_score" :min="0" :max="100" :step="5" style="width: 100%" />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="formData.risk_level" style="width: 100%">
            <el-option label="低风险" value="low" />
            <el-option label="中风险" value="medium" />
            <el-option label="高风险" value="high" />
            <el-option label="极高风险" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="formData.is_enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as ruleApi from '@/api/rules'

const loading = ref(false)
const rules = ref([])
const ruleTypes = ref([])
const showCreateDialog = ref(false)
const isEdit = ref(false)
const currentRuleId = ref('')

const filters = reactive({
  rule_type: '',
  is_enabled: null
})

const formData = reactive({
  rule_name: '',
  rule_type: 'amount',
  rule_expression: '',
  risk_score: 10,
  risk_level: 'low',
  description: '',
  is_enabled: true,
  created_by: 'admin'
})

const getTypeLabel = (type) => {
  const typeObj = ruleTypes.value.find(t => t.value === type)
  return typeObj ? typeObj.label : type
}

const getLevelLabel = (level) => {
  const labels = {
    critical: '极高',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[level] || level
}

const loadRules = async () => {
  loading.value = true
  try {
    const params = { ...filters }
    if (!params.rule_type) delete params.rule_type
    if (params.is_enabled === null) delete params.is_enabled

    const res = await ruleApi.getRules(params)
    rules.value = res
  } catch (error) {
    console.error('Failed to load rules:', error)
  } finally {
    loading.value = false
  }
}

const loadRuleTypes = async () => {
  try {
    const res = await ruleApi.getRuleTypes()
    ruleTypes.value = res.types
  } catch (error) {
    console.error('Failed to load rule types:', error)
  }
}

const resetFilters = () => {
  filters.rule_type = ''
  filters.is_enabled = null
  loadRules()
}

const onRuleTypeChange = (type) => {
  const templates = {
    amount: 'amount > 50000',
    frequency: 'transaction_count > 10',
    location: 'location_changed = true',
    device: 'new_device = true',
    time: 'hour >= 0 AND hour <= 5',
    merchant: 'merchant_risk = high',
    failure: 'consecutive_failures >= 3',
    balance: 'balance_change > 80',
    custom: 'amount > 10000 and transaction_type == "withdrawal"'
  }
  if (templates[type]) {
    formData.rule_expression = templates[type]
  }
}

const editRule = (row) => {
  isEdit.value = true
  currentRuleId.value = row.rule_id
  Object.assign(formData, {
    rule_name: row.rule_name,
    rule_type: row.rule_type,
    rule_expression: row.rule_expression,
    risk_score: row.risk_score,
    risk_level: row.risk_level,
    description: row.description,
    is_enabled: row.is_enabled
  })
  showCreateDialog.value = true
}

const toggleRule = async (row) => {
  try {
    await ruleApi.toggleRule(row.rule_id)
    ElMessage.success(row.is_enabled ? '已禁用' : '已启用')
    loadRules()
  } catch (error) {
    console.error('Failed to toggle rule:', error)
  }
}

const deleteRule = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await ruleApi.deleteRule(row.rule_id)
    ElMessage.success('删除成功')
    loadRules()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete rule:', error)
    }
  }
}

const submitForm = async () => {
  try {
    if (isEdit.value) {
      await ruleApi.updateRule(currentRuleId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await ruleApi.createRule(formData)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    loadRules()
  } catch (error) {
    console.error('Failed to submit form:', error)
  }
}

showCreateDialog.value = false

onMounted(() => {
  loadRules()
  loadRuleTypes()
})
</script>

<style scoped>
.rules-page {
  padding: 0;
}
</style>
