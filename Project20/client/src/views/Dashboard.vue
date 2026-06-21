<template>
  <div class="dashboard-container">
    <el-header class="header">
      <div class="logo">
        <el-icon><EditPen /></el-icon>
        <span>协作白板</span>
      </div>
      <div class="user-info">
        <el-avatar :size="32" style="background-color: #409eff;">
          {{ userStore.user?.username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
        <span class="username">{{ userStore.user?.username }}</span>
        <el-button type="danger" link @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>

    <el-main class="main-content">
      <div class="toolbar">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建白板
        </el-button>
      </div>

      <el-empty v-if="!loading && whiteboards.length === 0" description="暂无白板，点击上方按钮创建第一个白板吧" />

      <el-row v-else :gutter="20">
        <el-col v-for="wb in whiteboards" :key="wb.id" :span="6" class="wb-col">
          <el-card class="wb-card" shadow="hover" @click="enterWhiteboard(wb.id)">
            <template #header>
              <div class="wb-header">
                <span class="wb-name">{{ wb.name }}</span>
                <el-dropdown @command="(cmd) => handleCommand(cmd, wb)">
                  <el-button link type="primary" size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            <div class="wb-preview">
              <el-icon :size="60" color="#c0c4cc"><Picture /></el-icon>
            </div>
            <div class="wb-meta">
              <span>元素数量：{{ wb.elementCount || 0 }} 个</span>
            </div>
            <div class="wb-meta">
              <span>更新时间：{{ formatDate(wb.updatedAt) }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <el-dialog v-model="showCreateDialog" title="创建白板" width="400px">
      <el-form :model="createForm" label-position="top">
        <el-form-item label="白板名称">
          <el-input v-model="createForm.name" placeholder="请输入白板名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createWhiteboard" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRenameDialog" title="重命名白板" width="400px">
      <el-form :model="renameForm" label-position="top">
        <el-form-item label="白板名称">
          <el-input v-model="renameForm.name" placeholder="请输入新的白板名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="renameWhiteboard" :loading="renaming">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const router = useRouter()
const userStore = useUserStore()

const whiteboards = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showRenameDialog = ref(false)
const creating = ref(false)
const renaming = ref(false)
const currentWhiteboard = ref(null)

const createForm = reactive({ name: '' })
const renameForm = reactive({ name: '' })

const fetchWhiteboards = async () => {
  loading.value = true
  try {
    const result = await api.get('/whiteboards')
    whiteboards.value = result.whiteboards || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const createWhiteboard = async () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入白板名称')
    return
  }
  creating.value = true
  try {
    const result = await api.post('/whiteboards', { name: createForm.name })
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createForm.name = ''
    whiteboards.value.unshift(result.whiteboard)
  } catch (e) {
    console.error(e)
  } finally {
    creating.value = false
  }
}

const enterWhiteboard = (id) => {
  router.push(`/whiteboard/${id}`)
}

const handleCommand = (cmd, wb) => {
  if (cmd === 'delete') {
    deleteWhiteboard(wb)
  } else if (cmd === 'rename') {
    openRenameDialog(wb)
  }
}

const openRenameDialog = (wb) => {
  currentWhiteboard.value = wb
  renameForm.name = wb.name
  showRenameDialog.value = true
}

const renameWhiteboard = async () => {
  if (!renameForm.name.trim()) {
    ElMessage.warning('请输入白板名称')
    return
  }
  renaming.value = true
  try {
    await api.put(`/whiteboards/${currentWhiteboard.value.id}`, { name: renameForm.name })
    ElMessage.success('重命名成功')
    showRenameDialog.value = false
    fetchWhiteboards()
  } catch (e) {
    console.error(e)
  } finally {
    renaming.value = false
  }
}

const deleteWhiteboard = async (wb) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除白板"${wb.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await api.delete(`/whiteboards/${wb.id}`)
    ElMessage.success('删除成功')
    fetchWhiteboards()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(fetchWhiteboards)
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  color: #606266;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 30px 40px;
}

.toolbar {
  margin-bottom: 30px;
}

.wb-col {
  margin-bottom: 20px;
}

.wb-card {
  cursor: pointer;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.wb-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.wb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wb-name {
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.wb-preview {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  border-radius: 4px;
  margin-bottom: 15px;
  min-height: 120px;
}

.wb-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
</style>
