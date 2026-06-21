<template>
  <div class="maintenance-management">
    <div class="page-header">
      <h2 class="page-title">维护管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="维护计划" name="plans">
        <div class="card-shadow mb-20" style="padding: 20px">
          <div class="flex-between mb-16">
            <el-form :inline="true" :model="planSearch">
              <el-form-item label="计划状态">
                <el-select v-model="planSearch.status" placeholder="全部" clearable style="width: 140px">
                  <el-option label="待执行" value="待执行" />
                  <el-option label="进行中" value="进行中" />
                  <el-option label="已完成" value="已完成" />
                  <el-option label="已逾期" value="已逾期" />
                </el-select>
              </el-form-item>
              <el-form-item label="设备ID">
                <el-input v-model="planSearch.device_id" placeholder="请输入设备ID" clearable />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadPlanList">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="resetPlanSearch">
                  <el-icon><RefreshRight /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-form>
            <el-button type="primary" @click="openPlanDialog">
              <el-icon><Plus /></el-icon>
              新增计划
            </el-button>
          </div>

          <el-table :data="planList" v-loading="planLoading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="plan_name" label="计划名称" width="150" />
            <el-table-column prop="device_id" label="设备ID" width="80" />
            <el-table-column prop="plan_type" label="维护类型" width="120">
              <template #default="{ row }">{{ getMaintenanceType(row.plan_type) }}</template>
            </el-table-column>
            <el-table-column prop="frequency" label="维护周期" width="100" />
            <el-table-column prop="next_maintain_time" label="下次维护" width="180">
              <template #default="{ row }">{{ formatTime(row.next_maintain_time) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPlanStatusTagType(row.status)" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewPlan(row)">查看</el-button>
                <el-button type="primary" link @click="editPlan(row)">编辑</el-button>
                <el-button type="success" link v-if="row.status === '待执行' || row.status === '已逾期'" @click="executePlan(row)">执行</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="planPagination.page"
              v-model:page-size="planPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="planPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handlePlanSizeChange"
              @current-change="loadPlanList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="维护记录" name="records">
        <div class="card-shadow" style="padding: 20px">
          <el-form :inline="true" :model="recordSearch" class="mb-16">
            <el-form-item label="设备ID">
              <el-input v-model="recordSearch.device_id" placeholder="请输入设备ID" clearable />
            </el-form-item>
            <el-form-item label="维护类型">
              <el-select v-model="recordSearch.maintain_type" placeholder="全部" clearable style="width: 140px">
                <el-option label="日常维护" value="日常维护" />
                <el-option label="预防性维护" value="预防性维护" />
                <el-option label="故障维修" value="故障维修" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadRecordList">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetRecordSearch">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>

          <el-table :data="recordList" v-loading="recordLoading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="device_id" label="设备ID" width="80" />
            <el-table-column prop="maintain_type" label="维护类型" width="120">
              <template #default="{ row }">{{ row.maintain_type }}</template>
            </el-table-column>
            <el-table-column prop="operator" label="维护人员" width="100" />
            <el-table-column prop="start_time" label="开始时间" width="180">
              <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" width="180">
              <template #default="{ row }">{{ formatTime(row.end_time) }}</template>
            </el-table-column>
            <el-table-column prop="cost" label="费用" width="100" />
            <el-table-column prop="content" label="维护内容" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewRecord(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="recordPagination.page"
              v-model:page-size="recordPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="recordPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleRecordSizeChange"
              @current-change="loadRecordList"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="planDialogVisible" :title="planDialogTitle" width="600px" destroy-on-close>
      <el-form :model="planForm" :rules="planRules" ref="planFormRef" label-width="100px">
        <el-form-item label="计划名称" prop="plan_name">
          <el-input v-model="planForm.plan_name" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="设备ID" prop="device_id">
          <el-input-number v-model="planForm.device_id" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="维护类型" prop="plan_type">
          <el-select v-model="planForm.plan_type" placeholder="请选择维护类型" style="width: 100%">
            <el-option label="日常维护" value="日常维护" />
            <el-option label="预防性维护" value="预防性维护" />
            <el-option label="故障维修" value="故障维修" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护周期">
          <el-select v-model="planForm.frequency" placeholder="请选择维护周期" style="width: 100%">
            <el-option label="每周" value="每周" />
            <el-option label="每月" value="每月" />
            <el-option label="每季度" value="每季度" />
            <el-option label="每半年" value="每半年" />
            <el-option label="每年" value="每年" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次维护">
          <el-date-picker v-model="planForm.next_maintain_time" type="datetime" placeholder="选择维护时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="planForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPlan">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDialogVisible" title="维护记录详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="ID">{{ currentRecord.id }}</el-descriptions-item>
        <el-descriptions-item label="设备ID">{{ currentRecord.device_id }}</el-descriptions-item>
        <el-descriptions-item label="维护类型">{{ currentRecord.maintain_type }}</el-descriptions-item>
        <el-descriptions-item label="维护人员">{{ currentRecord.operator }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatTime(currentRecord.start_time) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatTime(currentRecord.end_time) }}</el-descriptions-item>
        <el-descriptions-item label="费用">{{ currentRecord.cost }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRecord.remark || '无' }}</el-descriptions-item>
        <el-descriptions-item label="维护内容" :span="2">{{ currentRecord.content || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMaintenancePlanList, getMaintenanceRecordList, createMaintenancePlan, updateMaintenancePlan } from '@/api/maintenance'

const activeTab = ref('plans')
const planLoading = ref(false)
const recordLoading = ref(false)
const planDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const planDialogTitle = ref('新增维护计划')
const isPlanEdit = ref(false)
const planFormRef = ref(null)
const currentRecord = ref(null)

const planSearch = reactive({ status: '', device_id: '' })
const recordSearch = reactive({ device_id: '', maintain_type: '' })

const planPagination = reactive({ page: 1, pageSize: 10, total: 0 })
const recordPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const planList = ref([])
const recordList = ref([])

const planForm = reactive({
  id: null,
  plan_name: '',
  device_id: null,
  plan_type: '',
  frequency: '',
  next_maintain_time: '',
  status: '待执行',
  remark: ''
})

const planRules = {
  plan_name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  device_id: [{ required: true, message: '请输入设备ID', trigger: 'blur' }],
  plan_type: [{ required: true, message: '请选择维护类型', trigger: 'change' }]
}

onMounted(() => {
  loadPlanList()
  loadRecordList()
})

async function loadPlanList() {
  planLoading.value = true
  try {
    const params = { page: planPagination.page, pageSize: planPagination.pageSize }
    if (planSearch.status) params.status = planSearch.status
    if (planSearch.device_id) params.device_id = planSearch.device_id
    const res = await getMaintenancePlanList(params)
    if (res?.data) {
      planList.value = res.data.list || []
      planPagination.total = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('加载维护计划失败：' + (e?.message || '未知错误'))
  } finally {
    planLoading.value = false
  }
}

function handlePlanSizeChange() {
  planPagination.page = 1
  loadPlanList()
}

function resetPlanSearch() {
  planSearch.status = ''
  planSearch.device_id = ''
  planPagination.page = 1
  loadPlanList()
}

async function loadRecordList() {
  recordLoading.value = true
  try {
    const params = { page: recordPagination.page, pageSize: recordPagination.pageSize }
    if (recordSearch.device_id) params.device_id = recordSearch.device_id
    if (recordSearch.maintain_type) params.maintain_type = recordSearch.maintain_type
    const res = await getMaintenanceRecordList(params)
    if (res?.data) {
      recordList.value = res.data.list || []
      recordPagination.total = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('加载维护记录失败：' + (e?.message || '未知错误'))
  } finally {
    recordLoading.value = false
  }
}

function handleRecordSizeChange() {
  recordPagination.page = 1
  loadRecordList()
}

function resetRecordSearch() {
  recordSearch.device_id = ''
  recordSearch.maintain_type = ''
  recordPagination.page = 1
  loadRecordList()
}

function openPlanDialog() {
  isPlanEdit.value = false
  planDialogTitle.value = '新增维护计划'
  Object.assign(planForm, {
    id: null, plan_name: '', device_id: null, plan_type: '', frequency: '', next_maintain_time: '', status: '待执行', remark: ''
  })
  planDialogVisible.value = true
}

function editPlan(row) {
  isPlanEdit.value = true
  planDialogTitle.value = '编辑维护计划'
  Object.assign(planForm, row)
  planDialogVisible.value = true
}

function viewPlan(row) {
  editPlan(row)
}

async function executePlan(row) {
  try {
    await updateMaintenancePlan(row.id, { ...row, status: '进行中' })
    ElMessage.success(`已开始执行计划: ${row.plan_name}`)
    loadPlanList()
  } catch (e) {
    ElMessage.error('执行失败：' + (e?.message || '未知错误'))
  }
}

async function submitPlan() {
  if (!planFormRef.value) return
  await planFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isPlanEdit.value) {
          await updateMaintenancePlan(planForm.id, planForm)
        } else {
          await createMaintenancePlan(planForm)
        }
        ElMessage.success(isPlanEdit.value ? '更新成功' : '新增成功')
        planDialogVisible.value = false
        loadPlanList()
      } catch (e) {
        ElMessage.error(isPlanEdit.value ? '更新失败' : '新增失败')
      }
    }
  })
}

function viewRecord(row) {
  currentRecord.value = row
  recordDialogVisible.value = true
}

function getMaintenanceType(type) {
  const map = { '日常维护': '日常维护', '预防性维护': '预防性维护', '故障维修': '故障维修' }
  return map[type] || type
}

function getPlanStatusTagType(status) {
  const map = { '待执行': 'info', '进行中': 'warning', '已完成': 'success', '已逾期': 'danger' }
  return map[status] || 'info'
}

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}
</script>

<style scoped>
.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
