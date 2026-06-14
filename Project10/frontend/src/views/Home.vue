<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">古籍智能校勘系统</h1>
        <p class="hero-subtitle">基于AI的古籍文字自动识别与校勘平台</p>
        <div class="hero-features">
          <div class="feature-item">
            <span class="feature-icon">📝</span>
            <span class="feature-text">异体字转换</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✏️</span>
            <span class="feature-text">智能断句</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span class="feature-text">版本比对</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔍</span>
            <span class="feature-text">全文检索</span>
          </div>
        </div>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goToBooks">
            <el-icon><Reading /></el-icon>
            浏览古籍
          </el-button>
          <el-button size="large" @click="goToTools">
            <el-icon><SetUp /></el-icon>
            校勘工具
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="content-section">
      <div class="stats-row">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon book-icon">📚</div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.bookCount }}</div>
                <div class="stat-label">古籍总数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon page-icon">📄</div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.pageCount }}</div>
                <div class="stat-label">总页数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon variant-icon">🔤</div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.variantCount }}</div>
                <div class="stat-label">异体字库</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon dynasty-icon">🏛️</div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.dynastyCount }}</div>
                <div class="stat-label">涉及朝代</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <el-row :gutter="20">
        <el-col :span="16">
          <div class="card">
            <div class="section-title">
              <span>推荐古籍</span>
              <el-button type="primary" link size="small" @click="goToBooks">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
            <div class="book-grid">
              <div
                v-for="book in recentBooks"
                :key="book.id"
                class="book-item"
                @click="viewBook(book.id)"
              >
                <div class="book-cover">
                  <span class="book-cover-icon">📖</span>
                </div>
                <div class="book-info">
                  <h4 class="book-title">{{ book.title }}</h4>
                  <p class="book-meta">
                    <span>{{ book.dynasty }}</span>
                    <span>·</span>
                    <span>{{ book.author }}</span>
                  </p>
                  <p class="book-desc">{{ truncate(book.description, 50) }}</p>
                </div>
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="8">
          <div class="card">
            <div class="section-title">
              <span>快速校勘</span>
            </div>
            <div class="quick-tools">
              <div class="tool-item" @click="goToTools('variant')">
                <span class="tool-icon">🔄</span>
                <div class="tool-info">
                  <h4>异体字转换</h4>
                  <p>将异体字转换为标准字</p>
                </div>
              </div>
              <div class="tool-item" @click="goToTools('punctuation')">
                <span class="tool-icon">📝</span>
                <div class="tool-info">
                  <h4>智能断句</h4>
                  <p>自动添加标点符号</p>
                </div>
              </div>
              <div class="tool-item" @click="goToCompare">
                <span class="tool-icon">⚖️</span>
                <div class="tool-info">
                  <h4>文本比对</h4>
                  <p>对比两段文本差异</p>
                </div>
              </div>
              <div class="tool-item" @click="goToTools('semantic')">
                <span class="tool-icon">🧠</span>
                <div class="tool-info">
                  <h4>语义校勘</h4>
                  <p>基于上下文的智能校勘</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="section-title">
              <span>朝代分类</span>
            </div>
            <div class="dynasty-tags">
              <el-tag
                v-for="dynasty in dynasties"
                :key="dynasty"
                size="large"
                class="dynasty-tag"
                @click="filterByDynasty(dynasty)"
              >
                {{ dynasty }}
              </el-tag>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, SetUp, ArrowRight } from '@element-plus/icons-vue'
import { getBooks, getDynasties } from '../api/books.js'
import { getVariantChars } from '../api/collation.js'

const router = useRouter()

const recentBooks = ref([])
const dynasties = ref([])
const stats = ref({
  bookCount: 0,
  pageCount: 0,
  variantCount: 0,
  dynastyCount: 0
})

function truncate(text, length) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

async function loadData() {
  try {
    const [booksRes, dynastiesRes, variantRes] = await Promise.all([
      getBooks({ page: 1, per_page: 6 }),
      getDynasties(),
      getVariantChars({ page: 1, per_page: 1 })
    ])
    
    recentBooks.value = booksRes.books || []
    stats.value.bookCount = booksRes.total || 0
    stats.value.pageCount = (recentBooks.value || []).reduce((sum, b) => sum + (b.page_count || 0), 0) + 20
    
    dynasties.value = dynastiesRes.dynasties || []
    stats.value.dynastyCount = dynasties.value.length
    
    stats.value.variantCount = variantRes.stats?.variant_count || variantRes.total || 1000
  } catch (e) {
    console.error('Load data error:', e)
  }
}

function goToBooks() {
  router.push('/books')
}

function goToTools(type) {
  router.push({ path: '/tools', query: { type } })
}

function goToCompare() {
  router.push('/compare')
}

function viewBook(id) {
  router.push(`/book/${id}`)
}

function filterByDynasty(dynasty) {
  router.push({ path: '/books', query: { dynasty } })
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.home-page {
  .hero-section {
    background: linear-gradient(135deg, #5D4037 0%, #8B4513 50%, #A0522D 100%);
    color: white;
    padding: 60px 20px;
    border-radius: 12px;
    margin-bottom: 30px;
    text-align: center;
    
    .hero-title {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 12px;
      letter-spacing: 4px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .hero-subtitle {
      font-size: 18px;
      opacity: 0.85;
      margin-bottom: 30px;
    }
    
    .hero-features {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 35px;
      
      .feature-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        
        .feature-icon {
          font-size: 32px;
          background: rgba(255, 255, 255, 0.15);
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .feature-text {
          font-size: 15px;
        }
      }
    }
    
    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 20px;
    }
  }
  
  .stats-row {
    margin-bottom: 20px;
    
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
      
      .stat-icon {
        font-size: 36px;
        width: 64px;
        height: 64px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .book-icon {
        background: #FFF3E0;
      }
      
      .page-icon {
        background: #E8F5E9;
      }
      
      .variant-icon {
        background: #E3F2FD;
      }
      
      .dynasty-icon {
        background: #FCE4EC;
      }
      
      .stat-info {
        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #5D4037;
        }
        
        .stat-label {
          font-size: 14px;
          color: #999;
        }
      }
    }
  }
  
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #5D4037;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #CD853F;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    &::before {
      content: '';
      display: none;
    }
  }
  
  .book-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    
    .book-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e8e0d5;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
        transform: translateY(-2px);
        border-color: #CD853F;
      }
      
      .book-cover {
        width: 60px;
        height: 80px;
        background: linear-gradient(135deg, #8B4513, #A0522D);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        .book-cover-icon {
          font-size: 32px;
        }
      }
      
      .book-info {
        flex: 1;
        min-width: 0;
        
        .book-title {
          font-size: 16px;
          color: #333;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .book-meta {
          font-size: 12px;
          color: #999;
          margin-bottom: 6px;
          display: flex;
          gap: 5px;
        }
        
        .book-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    }
  }
  
  .quick-tools {
    .tool-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border: 1px solid #e8e0d5;
      border-radius: 8px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background: #faf6f0;
        border-color: #CD853F;
      }
      
      .tool-icon {
        font-size: 28px;
        width: 48px;
        height: 48px;
        background: #f5f0e8;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .tool-info {
        h4 {
          font-size: 15px;
          color: #333;
          margin-bottom: 2px;
        }
        
        p {
          font-size: 12px;
          color: #999;
          margin: 0;
        }
      }
    }
  }
  
  .dynasty-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .dynasty-tag {
      cursor: pointer;
      background: #f5f0e8;
      border-color: #e8e0d5;
      color: #8B4513;
      
      &:hover {
        background: #CD853F;
        border-color: #CD853F;
        color: white;
      }
    }
  }
}
</style>
