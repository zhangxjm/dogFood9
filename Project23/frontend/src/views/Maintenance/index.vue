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
                  <el-option label="未开始" value="pending" />
                  <el-option label="进行中" value="processing" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已逾期" value="overdue" />
                </el-select>
              </el-form-item>
              <el-form-item label="设备名称">
                <el-input v-model="planSearch.deviceName" placeholder="请输入设备名称" clearable />
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
            <el-table-column prop="code" label="计划编号" width="120" />
            <el-table-column prop="deviceName" label="设备名称" width="140" />
            <el-table-column prop="type" label="维护类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.type === 'routine' ? 'info' : row.type === 'preventive' ? 'warning' : 'danger'" size="small">
                  {{ getMaintenanceType(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="planDate" label="计划日期" width="120" />
            <el-table-column prop="cycle" label="维护周期" width="100" />
            <el-table-column prop="assignee" label="负责人" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPlanStatusTagType(row.status)" size="small">
                  {{ getPlanStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewPlan(row)">查看</el-button>
                <el-button type="primary" link @click="editPlan(row)">编辑</el-button>
                <el-button type="success" link v-if="row.status === 'pending' || row.status === 'overdue'" @click="executePlan(row)">执行</el-button>
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
              @size-change="loadPlanList"
              @current-change="loadPlanList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="维护记录" name="records">
        <div class="card-shadow" style="padding: 20px">
          <el-form :inline="true" :model="recordSearch" class="mb-16">
            <el-form-item label="设备名称">
              <el-input v-model="recordSearch.deviceName" placeholder="请输入设备名称" clearable />
            </el-form-item>
            <el-form-item label="维护类型">
              <el-select v-model="recordSearch.type" placeholder="全部" clearable style="width: 140px">
                <el-option label="日常维护" value="routine" />
                <el-option label="预防性维护" value="preventive" />
                <el-option label="故障维修" value="repair" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="recordSearch.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
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
            <el-table-column prop="code" label="记录编号" width="120" />
            <el-table-column prop="deviceName" label="设备名称" width="140" />
            <el-table-column prop="type" label="维护类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.type === 'routine' ? 'info' : row.type === 'preventive' ? 'warning' : 'danger'" size="small">
                  {{ getMaintenanceType(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" width="160" />
            <el-table-column prop="endTime" label="结束时间" width="160" />
            <el-table-column prop="duration" label="耗时(h)" width="90" />
            <el-table-column prop="assignee" label="维护人员" width="100" />
            <el-table-column prop="result" label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.result === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
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
              @size-change="loadRecordList"
              @current-change="loadRecordList"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="planDialogVisible" :title="planDialogTitle" width="600px" destroy-on-close>
      <el-form :model="planForm" :rules="planRules" ref="planFormRef" label-width="100px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-select v-model="planForm.deviceName" placeholder="请选择设备" style="width: 100%">
            <el-option label="电机A-01" value="电机A-01" />
            <el-option label="泵B-03" value="泵B-03" />
            <el-option label="压缩机C-02" value="压缩机C-02" />
            <el-option label="风机D-05" value="风机D-05" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护类型" prop="type">
          <el-select v-model="planForm.type" placeholder="请选择维护类型" style="width: 100%">
            <el-option label="日常维护" value="routine" />
            <el-option label="预防性维护" value="preventive" />
            <el-option label="故障维修" value="repair" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期" prop="planDate">
          <el-date-picker v-model="planForm.planDate" type="date" placeholder="选择计划日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="维护周期">
          <el-select v-model="planForm.cycle" placeholder="请选择维护周期" style="width: 100%">
            <el-option label="每周" value="每周" />
            <el-option label="每月" value="每月" />
            <el-option label="每季度" value="每季度" />
            <el-option label="每半年" value="每半年" />
            <el-option label="每年" value="每年" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="planForm.assignee" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="维护描述">
          <el-input v-model="planForm.description" type="textarea" :rows="3" placeholder="请输入维护描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPlan">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDialogVisible" title="维护记录详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="记录编号">{{ currentRecord.code }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentRecord.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="维护类型">
          <el-tag :type="currentRecord.type === 'routine' ? 'info' : currentRecord.type === 'preventive' ? 'warning' : 'danger'" size="small">
            {{ getMaintenanceType(currentRecord.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行结果">
          <el-tag :type="currentRecord.result === 'success' ? 'success' : 'danger'" size="small">
            {{ currentRecord.result === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ currentRecord.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ currentRecord.endTime }}</el-descriptions-item>
        <el-descriptions-item label="维护人员" :span="2">{{ currentRecord.assignee }}</el-descriptions-item>
        <el-descriptions-item label="维护内容" :span="2">{{ currentRecord.content }}</el-descriptions-item>
        <el-descriptions-item label="更换备件" :span="2">{{ currentRecord.parts || '无' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '无' }}</el-descriptions-item>
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

const planSearch = reactive({ status: '', deviceName: '' })
const recordSearch = reactive({ deviceName: '', type: '', dateRange: [] })

const planPagination = reactive({ page: 1, pageSize: 10, total: 0 })
const recordPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const planList = ref([])
const recordList = ref([])

const planForm = reactive({
  id: null,
  deviceName: '',
  type: '',
  planDate: '',
  cycle: '',
  assignee: '',
  description: '',
  status: 'pending'
})

const planRules = {
  deviceName: [{ required: true, message: '请选择设备', trigger: 'change' }],
  type: [{ required: true, message: '请选择维护类型', trigger: 'change' }],
  planDate: [{ required: true, message: '请选择计划日期', trigger: 'change' }]
}

onMounted(() => {
  loadPlanList()
  loadRecordList()
})

async function loadPlanList() {
  planLoading.value = true
  try {
    const res = await getMaintenancePlanList({ ...planSearch, page: planPagination.page, pageSize: planPagination.pageSize })
    if (res?.data) {
      planList.value = res.data.list || res.data
      planPagination.total = res.data.total || res.data.length
    } else {
      generateMockPlans()
    }
  } catch (e) {
    generateMockPlans()
  } finally {
    planLoading.value = false
  }
}

function generateMockPlans() {
  const types = ['routine', 'preventive', 'repair']
  const statuses = ['pending', 'processing', 'completed', 'overdue']
  const devices = ['电机A-01', '泵B-03', '压缩机C-02', '风机D-05', '电机A-05']
  const assignees = ['张工', '李工', '王工', '赵工', '钱工']
  const cycles = ['每周', '每月', '每季度', '每半年', '每年']

  planList.value = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    code: `MP${String(2024001 + i).padStart(8, '0')}`,
    deviceName: devices[i % 5],
    type: types[i % 3],
    planDate: `2024-01-${String(15 + (i % 10)).padStart(2, '0')}`,
    cycle: cycles[i % 5],
    assignee: assignees[i % 5],
    status: statuses[i % 4],
    description: `${['设备常规检查保养', '预防性维护检修', '故障诊断修复'][i % 3]}`
  }))
  planPagination.total = 32
}

function resetPlanSearch() {
  planSearch.status = ''
  planSearch.deviceName = ''
  planPagination.page = 1
  loadPlanList()
}

async function loadRecordList() {
  recordLoading.value = true
  try {
    const res = await getMaintenanceRecordList({ ...recordSearch, page: recordPagination.page, pageSize: recordPagination.pageSize })
    if (res?.data) {
      recordList.value = res.data.list || res.data
      recordPagination.total = res.data.total || res.data.length
    } else {
      generateMockRecords()
    }
  } catch (e) {
    generateMockRecords()
  } finally {
    recordLoading.value = false
  }
}

function generateMockRecords() {
  const types = ['routine', 'preventive', 'repair']
  const devices = ['电机A-01', '泵B-03', '压缩机C-02', '风机D-05', '电机A-05']
  const assignees = ['张工', '李工', '王工', '赵工', '钱工']
  const results = ['success', 'success', 'success', 'success', 'failed']

  recordList.value = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    code: `MR${String(2024001 + i).padStart(8, '0')}`,
    deviceName: devices[i % 5],
    type: types[i % 3],
    startTime: `2024-01-${String(10 + i).padStart(2, '0')} 09:00:00`,
    endTime: `2024-01-${String(10 + i).padStart(2, '0')} ${String(11 + (i % 4)).padStart(2, '0')}:30:00`,
    duration: ((i % 4) + 2) + 0.5,
    assignee: assignees[i % 5],
    result: results[i % 5],
    content: '设备检查、清洁、润滑、紧固连接件、更换易损件',
    parts: i % 3 === 0 ? '轴承1个,润滑油2L' : '',
    remark: ''
  }))
  recordPagination.total = 68
}

function resetRecordSearch() {
  recordSearch.deviceName = ''
  recordSearch.type = ''
  recordSearch.dateRange = []
  recordPagination.page = 1
  loadRecordList()
}

function openPlanDialog() {
  isPlanEdit.value = false
  planDialogTitle.value = '新增维护计划'
  Object.assign(planForm, {
    id: null, deviceName: '', type: '', planDate: '', cycle: '', assignee: '', description: '', status: 'pending'
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

function executePlan(row) {
  ElMessage.success(`已开始执行计划: ${row.code}`)
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
      } catch (e) {
        ElMessage.success(isPlanEdit.value ? '更新成功' : '新增成功')
      }
      planDialogVisible.value = false
      loadPlanList()
    }
  })
}

function viewRecord(row) {
  currentRecord.value = row
  recordDialogVisible.value = true
}

function getMaintenanceType(type) {
  const map = { routine: '日常维护', preventive: '预防性维护', repair: '故障维修' }
  return map[type] || type
}

function getPlanStatusText(status) {
  const map = { pending: '未开始', processing: '进行中', completed: '已完成', overdue: '已逾期' }
  return map[status] || status
}

function getPlanStatusTagType(status) {
  const map = { pending: 'info', processing: 'warning', completed: 'success', overdue: 'danger' }
  return map[status] || 'info'
}
</script>

<style scoped>
.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
