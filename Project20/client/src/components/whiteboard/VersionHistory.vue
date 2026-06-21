<template>
  <div class="version-history-mask" @click.self="$emit('close')">
    <div class="version-panel">
      <div class="panel-header">
        <span class="panel-title">
          <el-icon><Clock /></el-icon>
          版本历史
        </span>
        <el-button link @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <div class="version-list">
        <el-empty v-if="loading" description="加载中..." :image-size="60" />
        <el-empty v-else-if="store.versions.length === 0" description="暂无历史版本" :image-size="60" />

        <div
          v-for="(version, index) in sortedVersions"
          :key="version.id"
          class="version-item"
          :class="{ current: index === 0 }"
        >
          <div class="version-marker">
            <div class="marker-dot"></div>
            <div v-if="index < sortedVersions.length - 1" class="marker-line"></div>
          </div>

          <div class="version-content">
            <div class="version-header">
              <span class="version-title">
                {{ version.snapshotName || `版本 ${sortedVersions.length - index}` }}
              </span>
              <span class="version-time">{{ formatTime(version.createdAt) }}</span>
            </div>

            <div v-if="version.createdBy" class="version-user">
              <el-avatar :size="20" style="background-color: #909399; margin-right: 6px;">
                {{ String(version.createdBy).charAt(0).toUpperCase() }}
              </el-avatar>
              <span>{{ version.createdBy }}</span>
            </div>

            <div class="version-elements">
              包含 {{ (version.elements || []).length }} 个元素
            </div>

            <div class="version-actions" v-if="index !== 0">
              <el-button size="small" type="primary" @click="restoreVersion(version)">
                恢复此版本
              </el-button>
              <el-button size="small" type="danger" plain @click="deleteVersion(version.id)">
                删除
              </el-button>
            </div>

            <div v-if="index === 0" class="version-current-tag">
              <el-tag size="small" type="success">最新</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWhiteboardStore } from '../../stores/whiteboard'
import api from '../../utils/api'

const emit = defineEmits(['close', 'restore'])

const store = useWhiteboardStore()
const loading = ref(false)

const sortedVersions = computed(() => {
  return [...store.versions].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
})

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

const fetchVersions = async () => {
  if (!store.whiteboardId) return
  loading.value = true
  try {
    const versions = await api.get(`/whiteboards/${store.whiteboardId}/versions`)
    store.setVersions(Array.isArray(versions) ? versions : [])
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const restoreVersion = async (version) => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复此版本吗？当前内容将被覆盖，其他在线用户也会看到变化。',
      '恢复版本',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const result = await api.post(`/whiteboards/${store.whiteboardId}/versions/${version.id}/restore`)
    if (result && result.whiteboard) {
      emit('restore', result.whiteboard.elements || [])
    }
    ElMessage.success('版本恢复成功')
    fetchVersions()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const deleteVersion = async (versionId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此版本吗？删除后无法恢复。',
      '删除版本',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await api.delete(`/whiteboards/${store.whiteboardId}/versions/${versionId}`)
    ElMessage.success('版本删除成功')
    fetchVersions()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  if (store.versions.length === 0) {
    fetchVersions()
  }
})
</script>

<style scoped>
.version-history-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}

.version-panel {
  width: 420px;
  height: 100%;
  background-color: #fff;
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.version-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.version-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 20px;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #409eff;
  border: 2px solid #ecf5ff;
  flex-shrink: 0;
}

.version-item.current .marker-dot {
  background-color: #67c23a;
  border-color: #f0f9eb;
  width: 14px;
  height: 14px;
}

.marker-line {
  width: 2px;
  flex: 1;
  background-color: #ebeef5;
  margin-top: 6px;
  min-height: 40px;
}

.version-content {
  flex: 1;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 14px 16px;
  transition: all 0.2s;
}

.version-item.current .version-content {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.version-time {
  font-size: 12px;
  color: #909399;
}

.version-user {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.version-elements {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.version-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.version-current-tag {
  margin-top: 10px;
}
</style>
