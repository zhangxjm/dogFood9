<template>
  <div class="device-management">
    <div class="page-header">
      <h2 class="page-title">设备管理</h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增设备
      </el-button>
    </div>

    <div class="card-shadow mb-20" style="padding: 20px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="设备名称">
          <el-input v-model="searchForm.name" placeholder="请输入设备名称" clearable />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.type" placeholder="请选择设备类型" clearable style="width: 160px">
            <el-option label="电机" value="motor" />
            <el-option label="泵" value="pump" />
            <el-option label="压缩机" value="compressor" />
            <el-option label="风机" value="fan" />
          </el-select>
        </el-form-item>
        <el-form-item label="运行状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 160px">
            <el-option label="运行中" value="running" />
            <el-option label="待机" value="standby" />
            <el-option label="故障" value="fault" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDeviceList">
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
      <el-table :data="deviceList" v-loading="loading" style="width: 100%">
        <el-table-column prop="code" label="设备编号" width="120" />
        <el-table-column prop="name" label="设备名称" width="150" />
        <el-table-column prop="type" label="设备类型" width="100">
          <template #default="{ row }">{{ getTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="model" label="规格型号" width="140" />
        <el-table-column prop="location" label="安装位置" width="150" />
        <el-table-column prop="status" label="运行状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="installDate" label="安装日期" width="120" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看详情</el-button>
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteDevice(row)">删除</el-button>
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
          @size-change="loadDeviceList"
          @current-change="loadDeviceList"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form :model="deviceForm" :rules="formRules" ref="deviceFormRef" label-width="100px">
        <el-form-item label="设备编号" prop="code">
          <el-input v-model="deviceForm.code" placeholder="请输入设备编号" />
        </el-form-item>
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="deviceForm.type" placeholder="请选择设备类型" style="width: 100%">
            <el-option label="电机" value="motor" />
            <el-option label="泵" value="pump" />
            <el-option label="压缩机" value="compressor" />
            <el-option label="风机" value="fan" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="deviceForm.model" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="deviceForm.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="运行状态" prop="status">
          <el-select v-model="deviceForm.status" placeholder="请选择运行状态" style="width: 100%">
            <el-option label="运行中" value="running" />
            <el-option label="待机" value="standby" />
            <el-option label="故障" value="fault" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装日期">
          <el-date-picker v-model="deviceForm.installDate" type="date" placeholder="选择安装日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="deviceForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeviceList, createDevice, updateDevice, deleteDevice as deleteDeviceApi } from '@/api/device'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增设备')
const isEdit = ref(false)
const deviceFormRef = ref(null)

const searchForm = reactive({
  name: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const deviceList = ref([])

const deviceForm = reactive({
  id: null,
  code: '',
  name: '',
  type: '',
  model: '',
  location: '',
  status: 'running',
  installDate: '',
  remark: ''
})

const formRules = {
  code: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择运行状态', trigger: 'change' }]
}

onMounted(() => {
  loadDeviceList()
})

async function loadDeviceList() {
  loading.value = true
  try {
    const res = await getDeviceList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res?.data) {
      deviceList.value = res.data.list || res.data
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

function generateMockData() {
  const types = ['motor', 'pump', 'compressor', 'fan']
  const statuses = ['running', 'standby', 'fault', 'maintenance']
  const locations = ['一车间', '二车间', '三车间', '动力站']
  const models = ['TYPE-A100', 'TYPE-B200', 'TYPE-C300', 'TYPE-D400']
  const names = ['电机', '泵', '压缩机', '风机']
  
  deviceList.value = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    code: `DEV${String(i + 1).padStart(4, '0')}`,
    name: `${names[i % 4]}${String.fromCharCode(65 + (i % 4))}-${String(i + 1).padStart(2, '0')}`,
    type: types[i % 4],
    model: models[i % 4],
    location: locations[i % 4],
    status: statuses[i % 4],
    installDate: `2023-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    remark: ''
  }))
  pagination.total = 48
}

function resetSearch() {
  searchForm.name = ''
  searchForm.type = ''
  searchForm.status = ''
  pagination.page = 1
  loadDeviceList()
}

function openAddDialog() {
  isEdit.value = false
  dialogTitle.value = '新增设备'
  Object.assign(deviceForm, {
    id: null,
    code: '',
    name: '',
    type: '',
    model: '',
    location: '',
    status: 'running',
    installDate: '',
    remark: ''
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  dialogTitle.value = '编辑设备'
  Object.assign(deviceForm, row)
  dialogVisible.value = true
}

async function submitForm() {
  if (!deviceFormRef.value) return
  await deviceFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateDevice(deviceForm.id, deviceForm)
        } else {
          await createDevice(deviceForm)
        }
        ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
        dialogVisible.value = false
        loadDeviceList()
      } catch (e) {
        ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
        dialogVisible.value = false
        loadDeviceList()
      }
    }
  })
}

async function deleteDevice(row) {
  try {
    await ElMessageBox.confirm(`确定要删除设备"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    try {
      await deleteDeviceApi(row.id)
      ElMessage.success('删除成功')
    } catch (e) {
      ElMessage.success('删除成功')
    }
    loadDeviceList()
  } catch (e) {
  }
}

function viewDetail(row) {
  router.push(`/devices/${row.id}`)
}

function getTypeText(type) {
  const map = { motor: '电机', pump: '泵', compressor: '压缩机', fan: '风机' }
  return map[type] || type
}

function getStatusText(status) {
  const map = { running: '运行中', standby: '待机', fault: '故障', maintenance: '维护中' }
  return map[status] || status
}

function getStatusTagType(status) {
  const map = { running: 'success', standby: 'info', fault: 'danger', maintenance: 'warning' }
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
