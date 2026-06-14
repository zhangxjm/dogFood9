<template>
  <div class="devices">
    <div class="common-card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom: 0;">设备列表</h3>
        <div class="header-actions">
          <el-select v-model="filterType" placeholder="设备类型" style="width: 150px; margin-right: 12px;" clearable>
            <el-option label="土壤传感器" value="soil_sensor" />
            <el-option label="气象站" value="weather_station" />
            <el-option label="电磁阀" value="valve" />
          </el-select>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加设备
          </el-button>
        </div>
      </div>

      <el-table :data="filteredDevices" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="deviceTypeColor(row.type)" size="small">
              {{ deviceTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="deviceStatusType(row.status)" size="small" effect="light">
              <el-icon v-if="row.status === 'online'" class="status-icon"><Connection /></el-icon>
              <el-icon v-else class="status-icon"><Close /></el-icon>
              {{ deviceStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="last_seen" label="最后在线" width="180">
          <template #default="{ row }">
            {{ row.last_seen ? formatTime(row.last_seen) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="success" link @click="editDevice(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="deleteDevice(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showAddDialog" :title="editingDevice ? '编辑设备' : '添加设备'" width="500px">
      <el-form :model="deviceForm" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="deviceForm.type" placeholder="请选择设备类型" style="width: 100%;">
            <el-option label="土壤传感器" value="soil_sensor" />
            <el-option label="气象站" value="weather_station" />
            <el-option label="电磁阀" value="valve" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="deviceForm.location" placeholder="请输入设备位置" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="deviceForm.description" type="textarea" :rows="3" placeholder="请输入设备描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDevice">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" :title="selectedDevice?.name" width="600px">
      <div v-if="selectedDevice" class="device-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备ID">{{ selectedDevice.id }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ deviceTypeText(selectedDevice.type) }}</el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="deviceStatusType(selectedDevice.status)" size="small">
              {{ deviceStatusText(selectedDevice.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedDevice.location }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedDevice.description }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(selectedDevice.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="最后在线">
            {{ selectedDevice.last_seen ? formatTime(selectedDevice.last_seen) : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedDevice.type === 'soil_sensor'" class="latest-data">
          <h4 style="margin: 20px 0 12px;">最新数据</h4>
          <div v-if="latestSensorData" class="data-grid">
            <div class="data-item">
              <span class="data-label">土壤湿度</span>
              <span class="data-value">{{ latestSensorData.soil_moisture?.toFixed(1) }}%</span>
            </div>
            <div class="data-item">
              <span class="data-label">土壤温度</span>
              <span class="data-value">{{ latestSensorData.soil_temp?.toFixed(1) }}°C</span>
            </div>
            <div class="data-item">
              <span class="data-label">空气温度</span>
              <span class="data-value">{{ latestSensorData.temperature?.toFixed(1) }}°C</span>
            </div>
            <div class="data-item">
              <span class="data-label">空气湿度</span>
              <span class="data-value">{{ latestSensorData.humidity?.toFixed(1) }}%</span>
            </div>
            <div class="data-item">
              <span class="data-label">PH值</span>
              <span class="data-value">{{ latestSensorData.ph?.toFixed(2) }}</span>
            </div>
          </div>
          <div v-else class="no-data">暂无数据</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDevices, createDevice, updateDevice, deleteDevice as delDevice, getLatestSensorData } from '../api'

const devices = ref([])
const filterType = ref('')
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const selectedDevice = ref(null)
const editingDevice = ref(null)
const latestSensorData = ref(null)
const deviceForm = ref({
  name: '',
  type: '',
  location: '',
  description: ''
})

const filteredDevices = computed(() => {
  if (!filterType.value) return devices.value
  return devices.value.filter(d => d.type === filterType.value)
})

const deviceTypeText = (type) => {
  const texts = {
    soil_sensor: '土壤传感器',
    weather_station: '气象站',
    valve: '电磁阀'
  }
  return texts[type] || type
}

const deviceTypeColor = (type) => {
  const colors = {
    soil_sensor: '',
    weather_station: 'success',
    valve: 'warning'
  }
  return colors[type] || ''
}

const deviceStatusText = (status) => {
  const texts = {
    online: '在线',
    offline: '离线',
    fault: '故障'
  }
  return texts[status] || status
}

const deviceStatusType = (status) => {
  const types = {
    online: 'success',
    offline: 'info',
    fault: 'danger'
  }
  return types[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const loadDevices = async () => {
  try {
    devices.value = await getDevices()
  } catch (e) {
    ElMessage.error('加载设备列表失败')
  }
}

const editDevice = (device) => {
  editingDevice.value = device
  deviceForm.value = { ...device }
  showAddDialog.value = true
}

const viewDetail = async (device) => {
  selectedDevice.value = device
  showDetailDialog.value = true
  
  if (device.type === 'soil_sensor') {
    try {
      latestSensorData.value = await getLatestSensorData(device.id)
    } catch (e) {
      latestSensorData.value = null
    }
  }
}

const saveDevice = async () => {
  if (!deviceForm.value.name || !deviceForm.value.type) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    if (editingDevice.value) {
      await updateDevice(editingDevice.value.id, deviceForm.value)
      ElMessage.success('更新成功')
    } else {
      await createDevice(deviceForm.value)
      ElMessage.success('添加成功')
    }
    showAddDialog.value = false
    loadDevices()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteDevice = (device) => {
  ElMessageBox.confirm(`确定要删除设备「${device.name}」吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await delDevice(device.id)
      ElMessage.success('删除成功')
      loadDevices()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.status-icon {
  margin-right: 4px;
}

.device-detail {
  padding: 10px 0;
}

.latest-data {
  margin-top: 20px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.data-item {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.data-label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.data-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>
