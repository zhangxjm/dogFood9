<template>
  <div class="book-detail-page">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>
    
    <template v-else>
      <div class="book-header card">
        <div class="book-cover-large">
          <span class="cover-icon">📖</span>
        </div>
        <div class="book-info">
          <h1 class="book-title">{{ book.title }}</h1>
          <div class="book-meta-row">
            <el-tag type="warning" effect="light" size="large">{{ book.dynasty || '未知' }}</el-tag>
            <span class="author">作者：{{ book.author || '佚名' }}</span>
            <span class="page-count">共 {{ book.page_count || 0 }} 页</span>
          </div>
          <p class="book-desc">{{ book.description || '暂无简介' }}</p>
          <div class="book-actions">
            <el-button type="primary" :icon="Edit" @click="startCollation">
              开始校勘
            </el-button>
            <el-button :icon="Refresh" @click="loadVersions">
              刷新
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="versions-section card">
        <div class="section-title">
          <span>版本列表</span>
          <el-button type="primary" size="small" :icon="Plus" @click="showAddVersionDialog">
            添加版本
          </el-button>
        </div>
        <div v-if="versions.length === 0" class="empty-text">暂无版本数据</div>
        <div v-else class="version-list">
          <div
            v-for="version in versions"
            :key="version.id"
            class="version-item"
            :class="{ active: currentVersion?.id === version.id }"
            @click="selectVersion(version)"
          >
            <div class="version-name">{{ version.version_name }}</div>
            <div class="version-desc">{{ version.description || '暂无描述' }}</div>
          </div>
        </div>
      </div>
      
      <div class="pages-section card">
        <div class="section-title">
          <span>书页列表</span>
          <span class="page-info">共 {{ pages.length }} 页</span>
        </div>
        
        <div v-if="pagesLoading" class="pages-loading">
          <el-skeleton :rows="4" animated />
        </div>
        
        <div v-else-if="pages.length === 0" class="empty-text">暂无书页数据</div>
        
        <div v-else class="page-grid">
          <div
            v-for="(page, idx) in pages"
            :key="page.id"
            class="page-item"
            @click="openPage(page)"
          >
            <div class="page-thumb">
              <span class="thumb-icon">📄</span>
              <span class="page-number">第{{ page.page_number }}页</span>
            </div>
            <div class="page-preview">
              {{ (page.ocr_text || page.content || '').slice(0, 50) }}...
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <el-dialog v-model="addVersionDialogVisible" title="添加版本" width="400px">
      <el-form :model="versionForm" label-width="80px">
        <el-form-item label="版本名">
          <el-input v-model="versionForm.version_name" placeholder="如：乾隆版、宋刻本" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="versionForm.description" type="textarea" :rows="3" placeholder="版本描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVersionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddVersion">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, Refresh, Plus } from '@element-plus/icons-vue'
import { getBook, getBookVersions, createBookVersion, getBookPages } from '../api/books.js'

const route = useRoute()
const router = useRouter()

const bookId = ref(route.params.id)

const book = ref({})
const versions = ref([])
const currentVersion = ref(null)
const pages = ref([])
const loading = ref(true)
const pagesLoading = ref(false)
const addVersionDialogVisible = ref(false)

const versionForm = reactive({
  version_name: '',
  description: ''
})

async function loadBook() {
  loading.value = true
  try {
    const res = await getBook(bookId.value)
    book.value = res
    loadVersions()
    loadPages()
  } catch (e) {
    console.error('Load book error:', e)
    ElMessage.error('加载书籍信息失败')
  } finally {
    loading.value = false
  }
}

async function loadVersions() {
  try {
    const res = await getBookVersions(bookId.value)
    versions.value = res.versions || []
    if (versions.value.length > 0) {
      currentVersion.value = versions.value[0]
    }
  } catch (e) {
    console.error('Load versions error:', e)
  }
}

async function loadPages() {
  pagesLoading.value = true
  try {
    const res = await getBookPages(bookId.value, { per_page: 50 })
    pages.value = res.pages || []
  } catch (e) {
    console.error('Load pages error:', e)
  } finally {
    pagesLoading.value = false
  }
}

function selectVersion(version) {
  currentVersion.value = version
}

function startCollation() {
  if (pages.value.length > 0) {
    router.push(`/collation/${bookId.value}/${pages.value[0].id}`)
  } else {
    ElMessage.warning('该书暂无书页内容')
  }
}

function openPage(page) {
  router.push(`/collation/${bookId.value}/${page.id}`)
}

function showAddVersionDialog() {
  versionForm.version_name = ''
  versionForm.description = ''
  addVersionDialogVisible.value = true
}

async function handleAddVersion() {
  if (!versionForm.version_name) {
    ElMessage.warning('请输入版本名')
    return
  }
  try {
    await createBookVersion(bookId.value, versionForm)
    ElMessage.success('添加成功')
    addVersionDialogVisible.value = false
    loadVersions()
  } catch (e) {
    console.error('Add version error:', e)
    ElMessage.error('添加失败')
  }
}

onMounted(() => {
  loadBook()
})
</script>

<style lang="scss" scoped>
.book-detail-page {
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .book-header {
    display: flex;
    gap: 24px;
    
    .book-cover-large {
      width: 160px;
      height: 220px;
      background: linear-gradient(135deg, #8B4513, #A0522D);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      .cover-icon {
        font-size: 72px;
      }
    }
    
    .book-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .book-title {
        font-size: 28px;
        color: #5D4037;
        margin: 0 0 16px 0;
      }
      
      .book-meta-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        
        .author,
        .page-count {
          font-size: 14px;
          color: #666;
        }
      }
      
      .book-desc {
        font-size: 14px;
        color: #666;
        line-height: 1.8;
        margin-bottom: 20px;
        flex: 1;
      }
      
      .book-actions {
        display: flex;
        gap: 12px;
      }
    }
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #5D4037;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #CD853F;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .page-info {
      font-size: 13px;
      font-weight: normal;
      color: #999;
    }
  }
  
  .version-list {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    
    .version-item {
      padding: 12px 16px;
      border: 1px solid #e8e0d5;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 180px;
      
      &:hover {
        border-color: #CD853F;
        background: #faf6f0;
      }
      
      &.active {
        border-color: #CD853F;
        background: #FFF3E0;
      }
      
      .version-name {
        font-size: 15px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }
      
      .version-desc {
        font-size: 12px;
        color: #999;
      }
    }
  }
  
  .page-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    
    .page-item {
      border: 1px solid #e8e0d5;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
        transform: translateY(-2px);
        border-color: #CD853F;
      }
      
      .page-thumb {
        height: 100px;
        background: #faf6f0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        
        .thumb-icon {
          font-size: 36px;
        }
        
        .page-number {
          font-size: 13px;
          color: #666;
        }
      }
      
      .page-preview {
        padding: 10px 12px;
        font-size: 12px;
        color: #666;
        line-height: 1.5;
        height: 50px;
        overflow: hidden;
        background: white;
      }
    }
  }
  
  .loading-container,
  .pages-loading,
  .empty-text {
    padding: 40px 20px;
    text-align: center;
  }
  
  .empty-text {
    color: #999;
    font-size: 14px;
  }
}
</style>
