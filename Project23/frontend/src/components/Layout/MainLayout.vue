<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <el-icon :size="24" color="#fff"><DataBoard /></el-icon>
        <span class="logo-text">监控平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="false"
        router
        background-color="#001529"
        text-color="#b7bdc6"
        active-text-color="#409EFF"
        class="side-menu"
      >
        <el-menu-item v-for="route in menuRoutes" :key="route.path" :index="`/${route.path}`">
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <template #title>{{ route.meta.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unhandledCount" :hidden="unhandledCount === 0" class="header-badge">
            <el-button type="primary" link @click="goToAlerts">
              <el-icon :size="18"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlertStore } from '@/store/alert'

const route = useRoute()
const router = useRouter()
const alertStore = useAlertStore()

const activeMenu = computed(() => route.path)
const unhandledCount = computed(() => alertStore.unhandledCount)

const menuRoutes = computed(() => {
  return router.options.routes[0].children.filter(r => !r.meta?.hidden)
})

function goToAlerts() {
  router.push('/alerts')
}
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.layout-aside {
  background-color: #001529;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.side-menu {
  border-right: none;
  height: calc(100% - 60px);
}

.side-menu:not(.el-menu--collapse) {
  width: 220px;
}

.layout-header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e6e8eb;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  color: #303133;
  font-size: 14px;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
