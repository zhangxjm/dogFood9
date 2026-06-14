<template>
  <div class="search-page">
    <div class="search-header">
      <div class="search-bar">
        <el-input
          v-model="keyword"
          size="large"
          placeholder="搜索古籍内容、书名、作者..."
          clearable
          @keyup.enter="doSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" @click="doSearch" :loading="loading">
          搜索
        </el-button>
      </div>
      
      <div class="search-filters">
        <el-select v-model="filterDynasty" placeholder="所有朝代" clearable style="width: 150px" @change="doSearch">
          <el-option v-for="d in dynasties" :key="d" :label="d" :value="d" />
        </el-select>
        <el-select v-model="searchType" placeholder="搜索类型" style="width: 150px" @change="doSearch">
          <el-option label="全文" value="all" />
          <el-option label="标题" value="title" />
          <el-option label="作者" value="author" />
          <el-option label="内容" value="content" />
        </el-select>
      </div>
    </div>
    
    <div class="search-results card">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="!hasSearched" class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">输入关键词开始搜索</div>
      </div>
      
      <div v-else-if="results.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">未找到相关结果</div>
        <p class="empty-hint">试试其他关键词吧</p>
      </div>
      
      <div v-else>
        <div class="results-header">
          <span class="results-count">找到 <b>{{ total }}</b> 条结果</span>
          <span v-if="esAvailable" class="es-badge">
            <el-tag size="small" type="success">Elasticsearch</el-tag>
          </span>
          <span v-else class="es-badge">
            <el-tag size="small">数据库搜索</el-tag>
          </span>
        </div>
        
        <div class="result-list">
          <div
            v-for="item in results"
            :key="item.id + '-' + item.type"
            class="result-item"
            @click="viewResult(item)"
          >
            <div class="result-type-tag">
              <el-tag size="small" :type="item.type === 'book' ? 'primary' : 'warning'">
                {{ item.type === 'book' ? '古籍' : '书页' }}
              </el-tag>
            </div>
            <div class="result-content">
              <h4 class="result-title" v-html="highlight(item.title)"></h4>
              <div class="result-meta">
                <span v-if="item.dynasty">{{ item.dynasty }}</span>
                <span v-if="item.dynasty && item.author"> · </span>
                <span v-if="item.author">{{ item.author }}</span>
                <span v-if="item.page_number"> · 第{{ item.page_number }}页</span>
              </div>
              <p class="result-highlight" v-if="item.highlight" v-html="item.highlight"></p>
              <p class="result-desc" v-else>{{ item.description || item.content?.slice(0, 100) }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="total > pageSize" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="doSearch"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { searchFulltext } from '../api/search.js'
import { getDynasties } from '../api/books.js'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const filterDynasty = ref('')
const searchType = ref('all')
const results = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const hasSearched = ref(false)
const esAvailable = ref(false)
const dynasties = ref([])

function highlight(text) {
  if (!text || !keyword.value) return text
  const kw = keyword.value
  return text.replace(new RegExp(kw, 'gi'), match => `<em class="hl">${match}</em>`)
}

async function loadDynasties() {
  try {
    const res = await getDynasties()
    dynasties.value = res.dynasties || []
  } catch (e) {
    console.error('Load dynasties error:', e)
  }
}

async function doSearch() {
  if (!keyword.value.trim()) {
    results.value = []
    total.value = 0
    hasSearched.value = false
    return
  }
  
  loading.value = true
  try {
    const res = await searchFulltext({
      q: keyword.value,
      dynasty: filterDynasty.value || undefined,
      search_type: searchType.value,
      page: page.value,
      per_page: pageSize.value
    })
    
    results.value = res.results || []
    total.value = res.total || 0
    esAvailable.value = res.es_available || false
    hasSearched.value = true
  } catch (e) {
    console.error('Search error:', e)
    results.value = []
    total.value = 0
    hasSearched.value = true
  } finally {
    loading.value = false
  }
}

function viewResult(item) {
  if (item.type === 'book') {
    router.push(`/book/${item.id}`)
  } else {
    router.push(`/book/${item.book_id}?page=${item.page_number || 1}`)
  }
}

onMounted(() => {
  loadDynasties()
  if (route.query.q) {
    keyword.value = route.query.q
    doSearch()
  }
})
</script>

<style lang="scss" scoped>
.search-page {
  .search-header {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    padding: 24px;
    margin-bottom: 20px;
    
    .search-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      
      .el-input {
        flex: 1;
      }
    }
    
    .search-filters {
      display: flex;
      gap: 12px;
    }
  }
  
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    padding: 20px;
  }
  
  .search-results {
    .loading-state,
    .empty-state {
      padding: 60px 20px;
      text-align: center;
    }
    
    .empty-state {
      .empty-icon {
        font-size: 56px;
        margin-bottom: 16px;
      }
      
      .empty-text {
        font-size: 16px;
        color: #666;
        margin-bottom: 8px;
      }
      
      .empty-hint {
        font-size: 14px;
        color: #999;
        margin: 0;
      }
    }
    
    .results-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0ebe3;
      
      .results-count {
        font-size: 14px;
        color: #666;
        
        b {
          color: #CD853F;
        }
      }
    }
    
    .result-list {
      .result-item {
        padding: 16px;
        border-bottom: 1px solid #f5f0e8;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: #faf6f0;
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .result-type-tag {
          margin-bottom: 8px;
        }
        
        .result-content {
          .result-title {
            font-size: 16px;
            color: #333;
            margin: 0 0 6px 0;
            
            :deep(.hl) {
              color: #f56c6c;
              font-style: normal;
              font-weight: bold;
            }
          }
          
          .result-meta {
            font-size: 13px;
            color: #999;
            margin-bottom: 8px;
          }
          
          .result-highlight {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin: 0;
            
            :deep(em) {
              color: #f56c6c;
              background: #fef0f0;
              font-style: normal;
              padding: 0 2px;
              border-radius: 2px;
            }
          }
          
          .result-desc {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin: 0;
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
