<template>
  <div class="alerts">
    <div class="common-card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom: 0;">告警中心</h3>
        <div class="header-actions">
          <el-radio-group v-model="filterResolved" size="small" @change="loadAlerts">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="unresolved">未处理</el-radio-button>
            <el-radio-button value="resolved">已处理</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="alert-stats">
        <div class="stat-item stat-critical">
          <span class="stat-number">{{ criticalCount }}</span>
          <span class="stat-label">严重告警</span>
        </div>
        <div class="stat-item stat-error">
          <span class="stat-number">{{ errorCount }}</span>
          <span class="stat-label">错误告警</span>
        </div>
        <div class="stat-item stat-warning">
          <span class="stat-number">{{ warningCount }}</span>
          <span class="stat-label">警告</span>
        </div>
        <div class="stat-item stat-info">
          <span class="stat-number">{{ infoCount }}</span>
          <span class="stat-label">信息</span>
        </div>
      </div>

      <el-table :data="alerts" style="width: 100%">
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="alertLevelType(row.level)" size="small">
              {{ alertLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="140">
          <template #default="{ row }">
            {{ alertTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="message" label="详细信息" min-width="250" />
        <el-table-column prop="device_id" label="关联设备" width="100">
          <template #default="{ row }">
            {{ row.device_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="resolved" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.resolved ? 'success' : 'warning'" size="small" effect="light">
              {{ row.resolved ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.resolved"
              size="small" 
              type="success" 
              link 
              @click="resolveAlert(row)"
            >
              标记已处理
            </el-button>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAlerts, resolveAlert as resAlert } from '../api'

const alerts = ref([])
const filterResolved = ref('all')
let ws = null

const criticalCount = computed(() => alerts.value.filter(a => a.level === 'critical' && !a.resolved).length)
const errorCount = computed(() => alerts.value.filter(a => a.level === 'error' && !a.resolved).length)
const warningCount = computed(() => alerts.value.filter(a => a.level === 'warning' && !a.resolved).length)
const infoCount = computed(() => alerts.value.filter(a => a.level === 'info' && !a.resolved).length)

const alertLevelText = (level) => {
  const texts = { info: '信息', warning: '警告', error: '错误', critical: '严重' }
  return texts[level] || level
}

const alertLevelType = (level) => {
  const types = { info: 'info', warning: 'warning', error: 'danger', critical: 'danger' }
  return types[level] || 'info'
}

const alertTypeText = (type) => {
  const texts = {
    device_offline: '设备离线',
    device_fault: '设备故障',
    low_moisture: '土壤湿度低',
    high_moisture: '土壤湿度高',
    irrigation_fail: '灌溉失败',
    system_error: '系统错误'
  }
  return texts[type] || type
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const loadAlerts = async () => {
  try {
    const params = { limit: 50 }
    if (filterResolved.value === 'unresolved') {
      params.resolved = false
    } else if (filterResolved.value === 'resolved') {
      params.resolved = true
    }
    alerts.value = await getAlerts(params)
  } catch (e) {
    ElMessage.error('加载告警列表失败')
  }
}

const resolveAlert = async (alert) => {
  try {
    await resAlert(alert.id)
    ElMessage.success('已标记为处理')
    loadAlerts()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'alert') {
        loadAlerts()
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
  loadAlerts()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) ws.close()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.alert-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-critical {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.stat-error {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.stat-warning {
  background: #fdf6ec;
  border: 1px solid #faecd8;
}

.stat-info {
  background: #ecf5ff;
  border: 1px solid #d9ecff;
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-critical .stat-number { color: #f56c6c; }
.stat-error .stat-number { color: #f56c6c; }
.stat-warning .stat-number { color: #e6a23c; }
.stat-info .stat-number { color: #409eff; }

.stat-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}
</style>
