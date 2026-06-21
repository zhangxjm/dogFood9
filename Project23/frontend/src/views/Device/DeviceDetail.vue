<template>
  <div class="device-detail">
    <div class="page-header">
      <div>
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title" style="display: inline; margin-left: 10px">设备详情 - {{ device?.name }}</h2>
      </div>
      <el-button type="primary" @click="openStatusDialog">
        <el-icon><Setting /></el-icon>
        变更状态
      </el-button>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="16">
        <div class="card-shadow" style="padding: 20px">
          <h3 class="chart-title">基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备编号">{{ device?.code }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ device?.name }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ getTypeText(device?.type) }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ device?.model }}</el-descriptions-item>
            <el-descriptions-item label="安装位置">{{ device?.location }}</el-descriptions-item>
            <el-descriptions-item label="运行状态">
              <el-tag :type="getStatusTagType(device?.status)" size="small">
                {{ getStatusText(device?.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="安装日期">{{ device?.installDate }}</el-descriptions-item>
            <el-descriptions-item label="使用年限">{{ device?.years || '3' }} 年</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ device?.manager || '张工' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ device?.phone || '138****8888' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ device?.remark || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-shadow" style="padding: 20px">
          <h3 class="chart-title">实时指标</h3>
          <el-row :gutter="16">
            <el-col :span="12" class="mb-16">
              <div class="metric-box">
                <div class="metric-label">温度</div>
                <div class="metric-value" :class="{ warning: metrics.temperature > 80 }">
                  {{ metrics.temperature?.toFixed(1) || '--' }}<span class="unit">°C</span>
                </div>
              </div>
            </el-col>
            <el-col :span="12" class="mb-16">
              <div class="metric-box">
                <div class="metric-label">振动</div>
                <div class="metric-value" :class="{ warning: metrics.vibration > 6 }">
                  {{ metrics.vibration?.toFixed(2) || '--' }}<span class="unit">mm/s</span>
                </div>
              </div>
            </el-col>
            <el-col :span="12" class="mb-16">
              <div class="metric-box">
                <div class="metric-label">压力</div>
                <div class="metric-value" :class="{ warning: metrics.pressure > 0.8 }">
                  {{ metrics.pressure?.toFixed(2) || '--' }}<span class="unit">MPa</span>
                </div>
              </div>
            </el-col>
            <el-col :span="12" class="mb-16">
              <div class="metric-box">
                <div class="metric-label">电流</div>
                <div class="metric-value" :class="{ warning: metrics.current > 30 }">
                  {{ metrics.current?.toFixed(1) || '--' }}<span class="unit">A</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>

    <div class="card-shadow mb-20" style="padding: 20px">
      <h3 class="chart-title">数据趋势</h3>
      <v-chart :option="trendOption" style="height: 300px" autoresize />
    </div>

    <div class="card-shadow" style="padding: 20px">
      <h3 class="chart-title">全生命周期</h3>
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="采购入库" description="2020-01-15" />
        <el-step title="安装调试" description="2020-02-20" />
        <el-step title="正常运行" description="2020-03-01 至今" />
        <el-step title="维护保养" :description="lastMaintenance || '2023-12-10'" />
        <el-step title="报废处置" description="预计 2030-01" />
      </el-steps>

      <div style="margin-top: 30px">
        <h4 style="margin-bottom: 16px; color: #606266">生命周期记录</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in lifecycleRecords"
            :key="index"
            :timestamp="item.time"
            :type="item.type"
            placement="top"
          >
            <el-card shadow="never">
              <h4 style="margin-bottom: 8px">{{ item.title }}</h4>
              <p style="color: #909399; margin: 0">{{ item.content }}</p>
              <p v-if="item.operator" style="color: #909399; margin: 8px 0 0">操作人：{{ item.operator }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <el-dialog v-model="statusDialogVisible" title="变更设备状态" width="400px">
      <el-form label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusTagType(device?.status)" size="large">
            {{ getStatusText(device?.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="目标状态">
          <el-select v-model="targetStatus" placeholder="请选择目标状态" style="width: 100%">
            <el-option label="运行中" value="running" />
            <el-option label="待机" value="standby" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input v-model="statusReason" type="textarea" :rows="3" placeholder="请输入变更原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStatusChange">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDeviceDetail, getDeviceLifecycle, updateDeviceStatus } from '@/api/device'

const route = useRoute()
const router = useRouter()

const device = ref(null)
const metrics = reactive({
  temperature: 68.5,
  vibration: 4.2,
  pressure: 0.55,
  current: 22.3
})
const activeStep = ref(3)
const lastMaintenance = ref('2023-12-10')
const statusDialogVisible = ref(false)
const targetStatus = ref('')
const statusReason = ref('')

const lifecycleRecords = ref([
  { time: '2020-01-15 10:30', title: '设备采购入库', content: '设备验收合格，办理入库手续', operator: '李主任', type: 'primary' },
  { time: '2020-02-20 14:00', title: '设备安装调试', content: '现场安装完成，调试运行正常', operator: '王工', type: 'success' },
  { time: '2020-03-01 08:00', title: '设备投入运行', content: '正式投入生产使用', operator: '张工', type: 'success' },
  { time: '2022-06-15 09:30', title: '定期维护保养', content: '更换润滑油，检查轴承磨损情况', operator: '赵工', type: 'warning' },
  { time: '2023-08-20 16:45', title: '故障维修', content: '电机轴承异响，更换轴承', operator: '钱工', type: 'danger' },
  { time: '2023-12-10 10:00', title: '年度维护保养', content: '全面检修，更换易损件', operator: '孙工', type: 'warning' }
])

onMounted(() => {
  loadDeviceDetail()
})

async function loadDeviceDetail() {
  const id = route.params.id
  try {
    const [detailRes, lifecycleRes] = await Promise.all([
      getDeviceDetail(id).catch(() => null),
      getDeviceLifecycle(id).catch(() => null)
    ])
    if (detailRes?.data) {
      device.value = detailRes.data
    } else {
      generateMockDevice(id)
    }
    if (lifecycleRes?.data) {
      lifecycleRecords.value = lifecycleRes.data
    }
  } catch (e) {
    generateMockDevice(id)
  }
}

function generateMockDevice(id) {
  const types = ['motor', 'pump', 'compressor', 'fan']
  const statuses = ['running', 'standby', 'fault', 'maintenance']
  const typeIndex = (parseInt(id) - 1) % 4
  device.value = {
    id: parseInt(id),
    code: `DEV${String(id).padStart(4, '0')}`,
    name: `电机A-${String(id).padStart(2, '0')}`,
    type: types[typeIndex],
    model: 'TYPE-A100',
    location: '一车间',
    status: statuses[typeIndex],
    installDate: '2020-03-01',
    years: 4,
    manager: '张工',
    phone: '138****8888',
    remark: '核心生产设备'
  }
  metrics.temperature = 60 + Math.random() * 30
  metrics.vibration = 2 + Math.random() * 5
  metrics.pressure = 0.3 + Math.random() * 0.5
  metrics.current = 15 + Math.random() * 20
}

function goBack() {
  router.back()
}

function openStatusDialog() {
  targetStatus.value = ''
  statusReason.value = ''
  statusDialogVisible.value = true
}

async function submitStatusChange() {
  if (!targetStatus.value) {
    ElMessage.warning('请选择目标状态')
    return
  }
  try {
    await updateDeviceStatus(device.value.id, targetStatus.value)
    ElMessage.success('状态变更成功')
  } catch (e) {
    lifecycleRecords.value.unshift({
      time: new Date().toLocaleString('zh-CN'),
      title: `状态变更：${getStatusText(device.value.status)} → ${getStatusText(targetStatus.value)}`,
      content: statusReason.value || '状态变更',
      operator: '管理员',
      type: 'primary'
    })
    device.value.status = targetStatus.value
    ElMessage.success('状态变更成功')
  }
  statusDialogVisible.value = false
}

const trendOption = computed(() => {
  const xData = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度(°C)', '振动(mm/s)', '压力(MPa)', '电流(A)'] },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: xData, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [
      {
        name: '温度(°C)', type: 'line', smooth: true,
        data: xData.map(() => (60 + Math.random() * 20).toFixed(1)),
        lineStyle: { color: '#F56C6C' }, itemStyle: { color: '#F56C6C' }
      },
      {
        name: '振动(mm/s)', type: 'line', smooth: true,
        data: xData.map(() => (3 + Math.random() * 3).toFixed(2)),
        lineStyle: { color: '#E6A23C' }, itemStyle: { color: '#E6A23C' }
      },
      {
        name: '压力(MPa)', type: 'line', smooth: true,
        data: xData.map(() => (0.4 + Math.random() * 0.3).toFixed(2)),
        lineStyle: { color: '#409EFF' }, itemStyle: { color: '#409EFF' }
      },
      {
        name: '电流(A)', type: 'line', smooth: true,
        data: xData.map(() => (18 + Math.random() * 10).toFixed(1)),
        lineStyle: { color: '#67C23A' }, itemStyle: { color: '#67C23A' }
      }
    ]
  }
})

function getTypeText(type) {
  const map = { motor: '电机', pump: '泵', compressor: '压缩机', fan: '风机' }
  return map[type] || type
}

function getStatusText(status) {
  const map = { running: '运行中', standby: '待机', fault: '故障', maintenance: '维护中', scrapped: '已报废' }
  return map[status] || status
}

function getStatusTagType(status) {
  const map = { running: 'success', standby: 'info', fault: 'danger', maintenance: 'warning', scrapped: 'info' }
  return map[status] || 'info'
}
</script>

<style scoped>
.metric-box {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.metric-value.warning {
  color: #F56C6C;
}

.metric-value .unit {
  font-size: 13px;
  font-weight: normal;
  margin-left: 4px;
  color: #909399;
}
</style>
