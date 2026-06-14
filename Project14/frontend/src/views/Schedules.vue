<template>
  <div class="schedules">
    <div class="common-card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom: 0;">定时任务列表</h3>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>

      <el-table :data="schedules" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="任务名称" min-width="150" />
        <el-table-column prop="valve_id" label="电磁阀ID" width="100" />
        <el-table-column prop="cron_expr" label="Cron 表达式" width="160">
          <template #default="{ row }">
            <el-tag type="info" size="small" effect="plain">{{ row.cron_expr }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="灌溉时长" width="120">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-switch 
              v-model="row.enabled" 
              @change="toggleSchedule(row)"
              active-text="启用"
              inactive-text="禁用"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="editSchedule(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="deleteSchedule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="common-card">
      <h3 class="section-title">Cron 表达式说明</h3>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="格式">秒 分 时 日 月 周</el-descriptions-item>
        <el-descriptions-item label="示例">
          <el-tag size="small" style="margin-right: 8px;">0 6 * * *</el-tag>每天早上6点
        </el-descriptions-item>
        <el-descriptions-item label="示例">
          <el-tag size="small" style="margin-right: 8px;">0 */2 * * *</el-tag>每2小时
        </el-descriptions-item>
        <el-descriptions-item label="示例">
          <el-tag size="small" style="margin-right: 8px;">0 8 1 * *</el-tag>每月1日早上8点
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <el-dialog v-model="showAddDialog" :title="editingSchedule ? '编辑任务' : '新建任务'" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="scheduleForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="电磁阀">
          <el-select v-model="scheduleForm.valve_id" placeholder="请选择电磁阀" style="width: 100%;">
            <el-option v-for="valve in valves" :key="valve.id" :label="valve.name" :value="valve.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Cron表达式">
          <el-input v-model="scheduleForm.cron_expr" placeholder="例如：0 6 * * *" />
        </el-form-item>
        <el-form-item label="灌溉时长">
          <el-input-number v-model="scheduleForm.duration" :min="60" :max="7200" :step="60" />
          <span style="color: #909399; margin-left: 8px;">秒</span>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="scheduleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSchedule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSchedules, createSchedule, updateSchedule, deleteSchedule as delSchedule, getDevices } from '../api'

const schedules = ref([])
const valves = ref([])
const showAddDialog = ref(false)
const editingSchedule = ref(null)
const scheduleForm = ref({
  name: '',
  valve_id: '',
  cron_expr: '',
  duration: 1800,
  enabled: true
})

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

const loadSchedules = async () => {
  try {
    schedules.value = await getSchedules()
  } catch (e) {
    ElMessage.error('加载定时任务失败')
  }
}

const loadValves = async () => {
  try {
    const devices = await getDevices()
    valves.value = devices.filter(d => d.type === 'valve')
  } catch (e) {
    console.error('Failed to load valves:', e)
  }
}

const editSchedule = (schedule) => {
  editingSchedule.value = schedule
  scheduleForm.value = { ...schedule }
  showAddDialog.value = true
}

const saveSchedule = async () => {
  if (!scheduleForm.value.name || !scheduleForm.value.cron_expr || !scheduleForm.value.valve_id) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    if (editingSchedule.value) {
      await updateSchedule(editingSchedule.value.id, scheduleForm.value)
      ElMessage.success('更新成功')
    } else {
      await createSchedule(scheduleForm.value)
      ElMessage.success('创建成功')
    }
    showAddDialog.value = false
    loadSchedules()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const toggleSchedule = async (schedule) => {
  try {
    await updateSchedule(schedule.id, { enabled: schedule.enabled })
    ElMessage.success(schedule.enabled ? '已启用' : '已禁用')
  } catch (e) {
    schedule.enabled = !schedule.enabled
    ElMessage.error('操作失败')
  }
}

const deleteSchedule = (schedule) => {
  ElMessageBox.confirm(`确定要删除任务「${schedule.name}」吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await delSchedule(schedule.id)
      ElMessage.success('删除成功')
      loadSchedules()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadSchedules()
  loadValves()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
