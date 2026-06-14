<template>
  <div class="tools-page">
    <div class="page-header">
      <h2 class="page-title">校勘工具</h2>
    </div>
    
    <el-tabs v-model="activeTab" class="tools-tabs">
      <el-tab-pane label="异体字转换" name="variant">
        <div class="tool-card">
          <div class="tool-description">
            <h3>异体字转换工具</h3>
            <p>将古籍中的异体字转换为现代标准字，基于10万+异体字数据库</p>
          </div>
          
          <div class="tool-content">
            <div class="text-input-section">
              <div class="section-label">输入文本</div>
              <el-input
                v-model="variantInput"
                type="textarea"
                :rows="8"
                placeholder="请输入包含异体字的古籍文本..."
              />
            </div>
            
            <div class="tool-actions">
              <el-button type="primary" size="large" :icon="Sort" @click="doVariantConvert" :loading="variantLoading">
                开始转换
              </el-button>
              <el-button :icon="RefreshLeft" @click="clearVariant">
                清空
              </el-button>
            </div>
            
            <div class="text-output-section">
              <div class="section-label">转换结果</div>
              <div class="output-box">
                <div v-if="variantResult" class="result-text">{{ variantResult }}</div>
                <div v-else class="placeholder">转换结果将显示在这里</div>
              </div>
              <div v-if="variantStats" class="stats-info">
                <el-tag type="success">转换 {{ variantStats.variant_count }} 个异体字</el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="智能断句" name="punctuation">
        <div class="tool-card">
          <div class="tool-description">
            <h3>智能断句标点工具</h3>
            <p>为无标点的古籍文本自动添加标点符号，包括句号、逗号、冒号、问号等</p>
          </div>
          
          <div class="tool-content">
            <div class="text-input-section">
              <div class="section-label">输入文本</div>
              <el-input
                v-model="punctuationInput"
                type="textarea"
                :rows="8"
                placeholder="请输入无标点的古籍文本..."
              />
            </div>
            
            <div class="tool-actions">
              <el-button type="primary" size="large" :icon="Edit" @click="doPunctuation" :loading="punctuationLoading">
                添加标点
              </el-button>
              <el-button :icon="RefreshLeft" @click="clearPunctuation">
                清空
              </el-button>
            </div>
            
            <div class="text-output-section">
              <div class="section-label">断句结果</div>
              <div class="output-box">
                <div v-if="punctuationResult" class="result-text">{{ punctuationResult }}</div>
                <div v-else class="placeholder">断句结果将显示在这里</div>
              </div>
              <div v-if="punctuationStats" class="stats-info">
                <el-tag type="primary">添加 {{ punctuationStats.punctuation_count }} 个标点</el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="语义校勘" name="semantic">
        <div class="tool-card">
          <div class="tool-description">
            <h3>语义校勘工具</h3>
            <p>基于上下文语义分析，自动检测并修正古籍中可能的文字错误</p>
          </div>
          
          <div class="tool-content">
            <div class="text-input-section">
              <div class="section-label">输入文本</div>
              <el-input
                v-model="semanticInput"
                type="textarea"
                :rows="8"
                placeholder="请输入需要校勘的古籍文本..."
              />
            </div>
            
            <div class="tool-actions">
              <el-button type="primary" size="large" :icon="MagicStick" @click="doSemantic" :loading="semanticLoading">
                开始校勘
              </el-button>
              <el-button :icon="RefreshLeft" @click="clearSemantic">
                清空
              </el-button>
            </div>
            
            <div class="text-output-section">
              <div class="section-label">校勘结果</div>
              <div class="output-box">
                <div v-if="semanticResult" class="result-text">
                  <span v-for="(item, idx) in semanticResult" :key="idx" :class="{ 'corrected': item.corrected }">
                    {{ item.text }}
                  </span>
                </div>
                <div v-else class="placeholder">校勘结果将显示在这里</div>
              </div>
              <div v-if="semanticStats" class="stats-info">
                <el-tag type="warning">发现 {{ semanticStats.error_count }} 处疑似错误</el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Sort, RefreshLeft, Edit, MagicStick } from '@element-plus/icons-vue'
import { convertVariantChar, insertPunctuation, semanticCollate } from '../api/collation.js'

const route = useRoute()

const activeTab = ref('variant')

const variantInput = ref('')
const variantResult = ref('')
const variantStats = ref(null)
const variantLoading = ref(false)

const punctuationInput = ref('')
const punctuationResult = ref('')
const punctuationStats = ref(null)
const punctuationLoading = ref(false)

const semanticInput = ref('')
const semanticResult = ref([])
const semanticStats = ref(null)
const semanticLoading = ref(false)

async function doVariantConvert() {
  if (!variantInput.value.trim()) {
    ElMessage.warning('请输入需要转换的文本')
    return
  }
  variantLoading.value = true
  try {
    const res = await convertVariantChar({ text: variantInput.value })
    variantResult.value = res.result
    variantStats.value = res.stats
    ElMessage.success('转换完成')
  } catch (e) {
    console.error('Variant convert error:', e)
    ElMessage.error('转换失败')
  } finally {
    variantLoading.value = false
  }
}

function clearVariant() {
  variantInput.value = ''
  variantResult.value = ''
  variantStats.value = null
}

async function doPunctuation() {
  if (!punctuationInput.value.trim()) {
    ElMessage.warning('请输入需要断句的文本')
    return
  }
  punctuationLoading.value = true
  try {
    const res = await insertPunctuation({ text: punctuationInput.value })
    punctuationResult.value = res.result
    punctuationStats.value = res.stats
    ElMessage.success('断句完成')
  } catch (e) {
    console.error('Punctuation error:', e)
    ElMessage.error('断句失败')
  } finally {
    punctuationLoading.value = false
  }
}

function clearPunctuation() {
  punctuationInput.value = ''
  punctuationResult.value = ''
  punctuationStats.value = null
}

async function doSemantic() {
  if (!semanticInput.value.trim()) {
    ElMessage.warning('请输入需要校勘的文本')
    return
  }
  semanticLoading.value = true
  try {
    const res = await semanticCollate({ text: semanticInput.value })
    const parts = []
    let lastIdx = 0
    const text = semanticInput.value
    
    if (res.corrections && res.corrections.length > 0) {
      for (const corr of res.corrections) {
        if (corr.position > lastIdx) {
          parts.push({ text: text.slice(lastIdx, corr.position), corrected: false })
        }
        parts.push({ text: corr.suggestion, corrected: true })
        lastIdx = corr.position + corr.length
      }
      if (lastIdx < text.length) {
        parts.push({ text: text.slice(lastIdx), corrected: false })
      }
    } else {
      parts.push({ text: text, corrected: false })
    }
    
    semanticResult.value = parts
    semanticStats.value = { error_count: res.correction_count || 0 }
    ElMessage.success('校勘完成')
  } catch (e) {
    console.error('Semantic collate error:', e)
    ElMessage.error('校勘失败')
  } finally {
    semanticLoading.value = false
  }
}

function clearSemantic() {
  semanticInput.value = ''
  semanticResult.value = []
  semanticStats.value = null
}

onMounted(() => {
  if (route.query.type) {
    activeTab.value = route.query.type
  }
  
  variantInput.value = '学而时习之不亦说乎有朋自远方来不亦乐乎人不知而不愠不亦君子乎'
})
</script>

<style lang="scss" scoped>
.tools-page {
  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 24px;
      color: #5D4037;
      margin: 0;
    }
  }
  
  .tools-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
    
    :deep(.el-tabs__item) {
      font-size: 16px;
      height: 48px;
      line-height: 48px;
    }
    
    :deep(.el-tabs__active-bar) {
      background-color: #CD853F;
    }
    
    :deep(.el-tabs__item.is-active) {
      color: #CD853F;
    }
  }
  
  .tool-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    padding: 24px;
    
    .tool-description {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0ebe3;
      
      h3 {
        font-size: 18px;
        color: #5D4037;
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }
    
    .tool-content {
      .section-label {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
      
      .text-input-section,
      .text-output-section {
        margin-bottom: 20px;
      }
      
      .tool-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .output-box {
        background: #faf6f0;
        border: 1px solid #e8e0d5;
        border-radius: 6px;
        padding: 16px;
        min-height: 200px;
        max-height: 300px;
        overflow-y: auto;
        
        .placeholder {
          color: #999;
          font-style: italic;
        }
        
        .result-text {
          line-height: 1.8;
          font-size: 15px;
          color: #333;
          white-space: pre-wrap;
          
          .corrected {
            color: #f56c6c;
            background: #fef0f0;
            padding: 0 2px;
            border-radius: 2px;
            font-weight: 500;
          }
        }
      }
      
      .stats-info {
        margin-top: 12px;
      }
    }
  }
}
</style>
