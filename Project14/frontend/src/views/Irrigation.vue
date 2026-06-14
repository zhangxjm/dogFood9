<template>
  <div class="irrigation">
    <div class="common-card">
      <h3 class="section-title">灌溉模式</h3>
      <el-radio-group v-model="irrigationMode" size="large">
        <el-radio-button value="manual">
          <el-icon style="margin-right: 6px;"><Operation /></el-icon>
          手动模式
        </el-radio-button>
        <el-radio-button value="auto">
          <el-icon style="margin-right: 6px;"><MagicStick /></el-icon>
          自动模式
        </el-radio-button>
        <el-radio-button value="schedule">
          <el-icon style="margin-right: 6px;"><Timer /></el-icon>
          定时模式
        </el-radio-button>
      </el-radio-group>
      <div class="mode-desc">
        <el-alert v-if="irrigationMode === 'manual'" type="info" :closable="false" show-icon>
          <template #title>手动模式</template>
          手动控制电磁阀的开关，适合临时灌溉或调试使用。
        </el-alert>
        <el-alert v-if="irrigationMode === 'auto'" type="success" :closable="false" show-icon>
          <template #title>自动模式</template>
          系统根据土壤湿度和天气预报自动决策灌溉，智能节水。
        </el-alert>
        <el-alert v-if="irrigationMode === 'schedule'" type="warning" :closable="false" show-icon>
          <template #title>定时模式</template>
          按照设定的时间表自动执行灌溉任务。
        </el-alert>
      </div>
    </div>

    <div class="common-card">
      <h3 class="section-title">电磁阀控制</h3>
      <el-row :gutter="20">
        <el-col :span="8" v-for="valve in valves" :key="valve.id">
          <div class="valve-card" :class="{ active: valveStatusMap[valve.id]?.is_running }">
            <div class="valve-header">
              <div class="valve-icon">
                <el-icon :size="32"><Switch /></el-icon>
              </div>
              <div class="valve-info">
                <h4>{{ valve.name }}</h4>
                <p>{{ valve.location }}</p>
              </div>
              <el-tag :type="valveStatusMap[valve.id]?.is_running ? 'success' : 'info'" size="small" effect="light">
                {{ valveStatusMap[valve.id]?.is_running ? '灌溉中' : '已关闭' }}
              </el-tag>
            </div>
            <div class="valve-status">
              <div class="status-item">
                <span class="status-label">设备状态</span>
                <span :class="['status-value', `status-${valve.status}`]">
                  {{ valve.status === 'online' ? '在线' : valve.status === 'offline' ? '离线' : '故障' }}
                </span>
              </div>
              <div class="status-item" v-if="valveStatusMap[valve.id]?.record">
                <span class="status-label">灌溉时长</span>
                <span class="status-value">
                  {{ formatDuration(valveStatusMap[valve.id].record.duration) }}
                </span>
              </div>
            </div>
            <div class="valve-actions">
              <el-input-number 
                v-model="durationMap[valve.id]" 
                :min="60" 
                :max="3600" 
                :step="60"
                size="small"
                style="width: 140px;"
              />
              <span style="color: #909399; font-size: 13px;">秒</span>
              <el-button 
                :type="valveStatusMap[valve.id]?.is_running ? 'danger' : 'primary'" 
                size="small"
                :disabled="valve.status !== 'online'"
                @click="toggleValve(valve)"
              >
                <el-icon v-if="valveStatusMap[valve.id]?.is_running"><Close /></el-icon>
                <el-icon v-else><VideoPlay /></el-icon>
                {{ valveStatusMap[valve.id]?.is_running ? '停止' : '开始' }}
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="common-card">
      <h3 class="section-title">灌溉记录</h3>
      <el-table :data="irrigationRecords" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="valve_id" label="电磁阀ID" width="100" />
        <el-table-column prop="mode" label="模式" width="100">
          <template #default="{ row }">
            <el-tag :type="modeType(row.mode)" size="small">
              {{ modeText(row.mode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="120">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="water_amount" label="用水量(L)" width="120">
          <template #default="{ row }">
            {{ row.water_amount?.toFixed(1) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="{ row }">
            {{ row.start_time ? formatTime(row.start_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="200" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getDevices, startIrrigation as startIrr, stopIrrigation as stopIrr, getValveStatus, getIrrigationRecords } from '../api'

const irrigationMode = ref('manual')
const valves = ref([])
const valveStatusMap = reactive({})
const durationMap = reactive({})
const irrigationRecords = ref([])
let ws = null

const modeText = (mode) => {
  const texts = { manual: '手动', auto: '自动', schedule: '定时' }
  return texts[mode] || mode
}

const modeType = (mode) => {
  const types = { manual: '', auto: 'success', schedule: 'warning' }
  return types[mode] || ''
}

const statusText = (status) => {
  const texts = { running: '进行中', stopped: '已停止', completed: '已完成' }
  return texts[status] || status
}

const statusType = (status) => {
  const types = { running: 'primary', stopped: 'info', completed: 'success' }
  return types[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
}

const loadValves = async () => {
  try {
    const devices = await getDevices()
    valves.value = devices.filter(d => d.type === 'valve')
    
    valves.value.forEach(valve => {
      if (!durationMap[valve.id]) {
        durationMap[valve.id] = 600
      }
      loadValveStatus(valve.id)
    })
  } catch (e) {
    ElMessage.error('加载电磁阀列表失败')
  }
}

const loadValveStatus = async (valveId) => {
  try {
    const status = await getValveStatus(valveId)
    valveStatusMap[valveId] = status
  } catch (e) {
    valveStatusMap[valveId] = { is_running: false, record: null }
  }
}

const loadRecords = async () => {
  try {
    irrigationRecords.value = await getIrrigationRecords({ limit: 20 })
  } catch (e) {
    ElMessage.error('加载灌溉记录失败')
  }
}

const toggleValve = async (valve) => {
  const isRunning = valveStatusMap[valve.id]?.is_running
  
  try {
    if (isRunning) {
      await stopIrr(valve.id)
      ElMessage.success('已停止灌溉')
    } else {
      await startIrr(valve.id, {
        duration: durationMap[valve.id],
        mode: irrigationMode.value
      })
      ElMessage.success('已开始灌溉')
    }
    loadValveStatus(valve.id)
    loadRecords()
  } catch (e) {
    ElMessage.error(isRunning ? '停止失败' : '启动失败')
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'irrigation_start') {
        loadValveStatus(msg.data.valve_id)
        loadRecords()
      }
    } catch (e) {
      console.error('WebSocket error:', e)
    }
  }

  ws.onclose = () => {
    setTimeout(connectWebSocket, 3000)
  }
}

onMounted(() => {
  loadValves()
  loadRecords()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) ws.close()
})
</script>

<style scoped>
.mode-desc {
  margin-top: 16px;
}

.valve-card {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.valve-card.active {
  border-color: #67c23a;
  background: #f0f9eb;
}

.valve-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.valve-icon {
  width: 56px;
  height: 56px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.active .valve-icon {
  color: #67c23a;
}

.valve-info {
  flex: 1;
}

.valve-info h4 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
}

.valve-info p {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.valve-status {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.status-label {
  color: #909399;
  font-size: 13px;
}

.status-value {
  font-size: 13px;
  font-weight: 500;
}

.status-online { color: #67c23a; }
.status-offline { color: #909399; }
.status-fault { color: #f56c6c; }

.valve-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
