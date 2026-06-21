<template>
  <div class="whiteboard-container">
    <el-header class="wb-header">
      <div class="left-section">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="wb-title">{{ store.whiteboardName }}</span>
        <el-tag v-if="onlineUsers.size > 0" type="success" size="small" class="online-tag">
          在线 {{ onlineUsers.size }} 人
        </el-tag>
      </div>
      <div class="center-section">
        <Toolbar />
      </div>
      <div class="right-section">
        <el-button @click="saveVersion">
          <el-icon><Collection /></el-icon>
          保存版本
        </el-button>
        <el-button @click="showVersions = true">
          <el-icon><Clock /></el-icon>
          历史版本
        </el-button>
        <el-button @click="showLayers = !showLayers">
          <el-icon><Menu /></el-icon>
          图层
        </el-button>
        <el-avatar :size="28" style="background-color: #409eff; margin-left: 10px;">
          {{ userStore.user?.username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
      </div>
    </el-header>

    <div class="wb-content">
      <InfiniteCanvas
        @element-add="handleElementAdd"
        @element-update="handleElementUpdate"
        @element-delete="handleElementDelete"
        @cursor-move="handleCursorMove"
        @save-elements="handleSaveElements"
      >
        <CursorOverlay />
      </InfiniteCanvas>

      <LayerPanel v-if="showLayers" @element-delete="handleElementDeleteFromPanel" @layer-changed="handleLayerChanged" />

      <VersionHistory v-if="showVersions" @close="showVersions = false" @restore="handleVersionRestore" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import { useWhiteboardStore } from '../stores/whiteboard'
import api from '../utils/api'
import { createSocket, disconnectSocket } from '../utils/socket'
import Toolbar from '../components/whiteboard/Toolbar.vue'
import InfiniteCanvas from '../components/whiteboard/InfiniteCanvas.vue'
import CursorOverlay from '../components/whiteboard/CursorOverlay.vue'
import LayerPanel from '../components/whiteboard/LayerPanel.vue'
import VersionHistory from '../components/whiteboard/VersionHistory.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const store = useWhiteboardStore()

const showLayers = ref(false)
const showVersions = ref(false)
const onlineUsers = reactive(new Map())
const saveTimer = ref(null)

let socket = null

const goBack = () => {
  router.push('/dashboard')
}

const fetchWhiteboard = async () => {
  try {
    const wb = await api.get(`/whiteboards/${route.params.id}`)
    store.initWhiteboard(wb.id, wb.name, wb.elements || [])
  } catch (e) {
    console.error(e)
    ElMessage.error('加载白板失败')
  }
}

const fetchVersions = async () => {
  try {
    const versions = await api.get(`/whiteboards/${route.params.id}/versions`)
    store.setVersions(versions)
  } catch (e) {
    console.error(e)
  }
}

const saveVersion = async () => {
  try {
    const { value: snapshotName } = await ElMessageBox.prompt(
      '请输入快照名称',
      '保存版本',
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '名称不能为空',
        inputValue: `快照_${new Date().toLocaleString('zh-CN')}`
      }
    )
    await api.post(`/whiteboards/${route.params.id}/versions`, {
      snapshot_name: snapshotName,
      elements: store.elements
    })
    ElMessage.success('版本保存成功')
    fetchVersions()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const scheduleSaveElements = () => {
  if (saveTimer.value) {
    clearTimeout(saveTimer.value)
  }
  saveTimer.value = setTimeout(() => {
    saveElements()
  }, 2000)
}

const saveElements = async () => {
  if (!socket) return
  try {
    socket.emit('save-whiteboard', {
      whiteboardId: route.params.id,
      elements: store.elements
    })
  } catch (e) {
    console.error('保存失败', e)
  }
}

const handleElementAdd = (element) => {
  if (socket) {
    socket.emit('element-add', {
      whiteboardId: route.params.id,
      element
    })
  }
  scheduleSaveElements()
}

const handleElementUpdate = (id, updates) => {
  if (socket) {
    socket.emit('element-update', {
      whiteboardId: route.params.id,
      id,
      updates
    })
  }
  scheduleSaveElements()
}

const handleElementDelete = (id) => {
  if (socket) {
    socket.emit('element-delete', {
      whiteboardId: route.params.id,
      id
    })
  }
  scheduleSaveElements()
}

const handleElementDeleteFromPanel = (id) => {
  store.deleteElement(id)
  handleElementDelete(id)
}

const handleCursorMove = (x, y) => {
  if (socket) {
    socket.emit('cursor-move', {
      whiteboardId: route.params.id,
      cursor: {
        x,
        y,
        username: userStore.user?.username
      }
    })
  }
}

const handleSaveElements = () => {
  scheduleSaveElements()
}

const handleVersionRestore = (elements) => {
  store.setElements(elements)
  if (socket) {
    socket.emit('elements-set', {
      whiteboardId: route.params.id,
      elements
    })
  }
  scheduleSaveElements()
}

const handleLayerChanged = () => {
  if (socket) {
    socket.emit('elements-set', {
      whiteboardId: route.params.id,
      elements: store.elements
    })
  }
  scheduleSaveElements()
}

const initSocket = () => {
  socket = createSocket()

  socket.emit('join-whiteboard', { whiteboardId: route.params.id }, (response) => {
    if (!response || !response.success) {
      ElMessage.error(response?.message || '加入白板失败')
      return
    }
    if (response.users) {
      onlineUsers.clear()
      response.users.forEach(u => {
        if (u.id !== userStore.user?.id) {
          onlineUsers.set(u.id, u)
        }
      })
    }
  })

  socket.on('user-joined', ({ user, users }) => {
    if (user.id !== userStore.user?.id) {
      onlineUsers.set(user.id, user)
      ElMessage.info(`${user.username} 加入了白板`)
    }
    if (users) {
      onlineUsers.clear()
      users.forEach(u => {
        if (u.id !== userStore.user?.id) {
          onlineUsers.set(u.id, u)
        }
      })
    }
  })

  socket.on('user-left', ({ user, users }) => {
    onlineUsers.delete(user.id)
    store.setRemoteCursor(user.id, null)
    if (user.id !== userStore.user?.id) {
      ElMessage.info(`${user.username} 离开了白板`)
    }
    if (users) {
      onlineUsers.clear()
      users.forEach(u => {
        if (u.id !== userStore.user?.id) {
          onlineUsers.set(u.id, u)
        }
      })
    }
  })

  socket.on('cursor-remove', ({ userId }) => {
    store.setRemoteCursor(userId, null)
  })

  socket.on('element-add', (element) => {
    if (element.userId !== userStore.user?.id) {
      const { userId, username, ...el } = element
      const existing = store.elements.find(e => e.id === el.id)
      if (!existing) {
        store.elements.push({ ...el, visible: true, locked: false })
      }
    }
  })

  socket.on('element-update', (data) => {
    if (data.userId !== userStore.user?.id) {
      store.updateElementLocal(data.id, data.updates)
    }
  })

  socket.on('element-delete', (data) => {
    if (data.userId !== userStore.user?.id) {
      store.elements = store.elements.filter(el => el.id !== data.id)
      store.selectedIds = store.selectedIds.filter(i => i !== data.id)
    }
  })

  socket.on('elements-set', (data) => {
    if (data.userId !== userStore.user?.id) {
      store.elements = data.elements || []
      store.saveHistory()
    }
  })

  socket.on('cursor-move', (data) => {
    if (data.userId !== userStore.user?.id) {
      store.setRemoteCursor(data.userId, data.cursor)
    }
  })

  socket.on('whiteboard-saved', (data) => {
    if (data.savedBy?.id !== userStore.user?.id) {
      ElMessage.info(`${data.savedBy?.username} 保存了白板`)
    }
  })
}

onMounted(() => {
  fetchWhiteboard().then(() => {
    fetchVersions()
    initSocket()
  })
})

onBeforeUnmount(() => {
  if (saveTimer.value) {
    clearTimeout(saveTimer.value)
  }
  saveElements()
  if (socket) {
    socket.emit('leave-whiteboard', { whiteboardId: route.params.id })
  }
  disconnectSocket()
  socket = null
  store.clearWhiteboard()
})
</script>

<style scoped>
.whiteboard-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

.wb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  flex-shrink: 0;
  height: 60px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 280px;
}

.wb-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.online-tag {
  margin-left: 4px;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 340px;
  justify-content: flex-end;
}

.wb-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
