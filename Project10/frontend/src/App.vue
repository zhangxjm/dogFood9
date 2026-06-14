<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo" @click="goHome">
            <span class="logo-icon">📚</span>
            <span class="logo-text">古籍智能校勘系统</span>
          </div>
          <nav class="nav-menu">
            <router-link to="/" class="nav-item" exact-active-class="active">首页</router-link>
            <router-link to="/books" class="nav-item" active-class="active">古籍库</router-link>
            <router-link to="/search" class="nav-item" active-class="active">全文检索</router-link>
            <router-link to="/tools" class="nav-item" active-class="active">校勘工具</router-link>
          </nav>
          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索古籍..."
              size="default"
              class="header-search"
              @keyup.enter="goSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
      
      <el-footer class="app-footer">
        <p>古籍智能校勘系统 © 2024 | 基于AI的古籍文字自动校勘平台</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const searchKeyword = ref('')

function goHome() {
  router.push('/')
}

function goSearch() {
  if (searchKeyword.value) {
    router.push({ path: '/search', query: { q: searchKeyword.value } })
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%);
  color: white;
  padding: 0;
  height: 60px;
  
  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 100%;
  }
  
  .logo {
    display: flex;
    align-items: center;
    cursor: pointer;
    
    .logo-icon {
      font-size: 24px;
      margin-right: 10px;
    }
    
    .logo-text {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 2px;
    }
  }
  
  .nav-menu {
    display: flex;
    gap: 30px;
    
    .nav-item {
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      font-size: 15px;
      transition: all 0.3s;
      
      &:hover, &.active {
        color: white;
        font-weight: 500;
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .header-search {
    width: 220px;
    
    :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.15);
      box-shadow: none;
      
      .el-input__inner {
        color: white;
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      }
      
      .el-input__prefix {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}

.app-main {
  flex: 1;
  background: #f5f0e8;
  padding: 20px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.app-footer {
  background: #5D4037;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 15px 0;
  font-size: 13px;
  height: auto;
  
  p {
    margin: 0;
  }
}
</style>
