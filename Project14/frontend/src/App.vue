<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#fff"><Watermelon /></el-icon>
        <span class="logo-text">智能灌溉系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>监控总览</span>
        </el-menu-item>
        <el-menu-item index="/devices">
          <el-icon><Cpu /></el-icon>
          <span>设备管理</span>
        </el-menu-item>
        <el-menu-item index="/data">
          <el-icon><DataLine /></el-icon>
          <span>数据监测</span>
        </el-menu-item>
        <el-menu-item index="/irrigation">
          <el-icon><Operation /></el-icon>
          <span>灌溉控制</span>
        </el-menu-item>
        <el-menu-item index="/schedules">
          <el-icon><Timer /></el-icon>
          <span>定时任务</span>
        </el-menu-item>
        <el-menu-item index="/alerts">
          <el-icon><Bell /></el-icon>
          <span>告警中心</span>
          <el-badge v-if="unresolvedCount > 0" :value="unresolvedCount" class="menu-badge" />
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <el-tooltip content="系统状态">
            <span class="status-dot status-online"></span>
            <span class="status-text">系统运行正常</span>
          </el-tooltip>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAlertStats } from './api'

const route = useRoute()
const unresolvedCount = ref(0)

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '智能农田灌溉监控系统')

let ws = null

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'alert') {
        unresolvedCount.value++
      }
    } catch (e) {
      console.error('WebSocket message error:', e)
    }
  }

  ws.onclose = () => {
    setTimeout(connectWebSocket, 3000)
  }
}

const loadAlertStats = async () => {
  try {
    const data = await getAlertStats()
    unresolvedCount.value = data.unresolved_count
  } catch (e) {
    console.error('Failed to load alert stats:', e)
  }
}

onMounted(() => {
  loadAlertStats()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<style scoped>
.app-container {
  height: 100%;
}

.sidebar {
  background-color: #1f2937;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #111827;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #374151;
}

.menu-badge {
  margin-left: 8px;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-online {
  background-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.status-text {
  font-size: 14px;
  color: #6b7280;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
