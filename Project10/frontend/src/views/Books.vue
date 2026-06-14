<template>
  <div class="books-page">
    <div class="page-header">
      <h2 class="page-title">古籍库</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog">
          添加古籍
        </el-button>
      </div>
    </div>
    
    <div class="filter-bar card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="书名/作者/内容"
            clearable
            @clear="loadBooks"
            @keyup.enter="loadBooks"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="朝代">
          <el-select
            v-model="filters.dynasty"
            placeholder="全部朝代"
            clearable
            @change="loadBooks"
            style="width: 150px"
          >
            <el-option
              v-for="dynasty in dynasties"
              :key="dynasty"
              :label="dynasty"
              :value="dynasty"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadBooks">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetFilters">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="books-list card">
      <el-skeleton v-if="loading" :rows="4" animated />
      
      <div v-else-if="books.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-text">暂无古籍数据</div>
      </div>
      
      <div v-else class="book-cards">
        <div
          v-for="book in books"
          :key="book.id"
          class="book-card"
          @click="viewBook(book.id)"
        >
          <div class="book-cover">
            <span class="cover-icon">📖</span>
            <span class="book-page-count">{{ book.page_count || 0 }}页</span>
          </div>
          <div class="book-content">
            <h3 class="book-title">{{ book.title }}</h3>
            <div class="book-meta">
              <el-tag size="small" type="warning" effect="light">{{ book.dynasty || '未知' }}</el-tag>
              <span class="author">{{ book.author || '佚名' }}</span>
            </div>
            <p class="book-desc">{{ book.description || '暂无简介' }}</p>
            <div class="book-footer">
              <span class="update-time">更新于 {{ formatDate(book.updated_at) }}</span>
              <el-button type="primary" link size="small" @click.stop="viewBook(book.id)">
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.per_page"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadBooks"
          @size-change="loadBooks"
        />
      </div>
    </div>
    
    <el-dialog v-model="createDialogVisible" title="添加古籍" width="500px">
      <el-form :model="bookForm" label-width="80px">
        <el-form-item label="书名">
          <el-input v-model="bookForm.title" placeholder="请输入书名" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="bookForm.author" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="朝代">
          <el-input v-model="bookForm.dynasty" placeholder="请输入朝代" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="bookForm.description" type="textarea" :rows="3" placeholder="请输入简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getBooks, createBook, getDynasties } from '../api/books.js'

const router = useRouter()
const route = useRoute()

const books = ref([])
const total = ref(0)
const dynasties = ref([])
const loading = ref(false)
const createDialogVisible = ref(false)

const filters = reactive({
  page: 1,
  per_page: 12,
  keyword: '',
  dynasty: ''
})

const bookForm = reactive({
  title: '',
  author: '',
  dynasty: '',
  description: ''
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN')
}

async function loadBooks() {
  loading.value = true
  try {
    const res = await getBooks(filters)
    books.value = res.books || []
    total.value = res.total || 0
  } catch (e) {
    console.error('Load books error:', e)
    ElMessage.error('加载古籍列表失败')
  } finally {
    loading.value = false
  }
}

async function loadDynasties() {
  try {
    const res = await getDynasties()
    dynasties.value = res.dynasties || []
  } catch (e) {
    console.error('Load dynasties error:', e)
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.dynasty = ''
  filters.page = 1
  loadBooks()
}

function viewBook(id) {
  router.push(`/book/${id}`)
}

function showCreateDialog() {
  createDialogVisible.value = true
  bookForm.title = ''
  bookForm.author = ''
  bookForm.dynasty = ''
  bookForm.description = ''
}

async function handleCreate() {
  if (!bookForm.title) {
    ElMessage.warning('请输入书名')
    return
  }
  try {
    await createBook(bookForm)
    ElMessage.success('添加成功')
    createDialogVisible.value = false
    loadBooks()
  } catch (e) {
    console.error('Create book error:', e)
    ElMessage.error('添加失败')
  }
}

onMounted(() => {
  if (route.query.dynasty) {
    filters.dynasty = route.query.dynasty
  }
  loadDynasties()
  loadBooks()
})
</script>

<style lang="scss" scoped>
.books-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    
    .page-title {
      font-size: 24px;
      color: #5D4037;
      margin: 0;
    }
  }
  
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .filter-bar {
    .el-form {
      margin: 0;
    }
  }
  
  .books-list {
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      
      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
      
      .empty-text {
        color: #999;
        font-size: 16px;
      }
    }
    
    .book-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      
      .book-card {
        border: 1px solid #e8e0d5;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
          transform: translateY(-2px);
          border-color: #CD853F;
        }
        
        .book-cover {
          height: 120px;
          background: linear-gradient(135deg, #8B4513, #A0522D);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          
          .cover-icon {
            font-size: 48px;
          }
          
          .book-page-count {
            position: absolute;
            right: 10px;
            bottom: 10px;
            background: rgba(0, 0, 0, 0.3);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
        }
        
        .book-content {
          padding: 12px 16px;
          
          .book-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .book-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            
            .author {
              font-size: 13px;
              color: #666;
            }
          }
          
          .book-desc {
            font-size: 13px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 10px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 40px;
          }
          
          .book-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 8px;
            border-top: 1px solid #f0ebe3;
            
            .update-time {
              font-size: 12px;
              color: #999;
            }
          }
        }
      }
    }
    
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
