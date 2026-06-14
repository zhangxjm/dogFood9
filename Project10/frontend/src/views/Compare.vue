<template>
  <div class="compare-page">
    <div class="page-header">
      <h2 class="page-title">文本比对</h2>
      <p class="page-desc">对比两段古籍文本的差异，支持不同版本的校勘比对</p>
    </div>
    
    <div class="compare-inputs">
      <div class="input-card">
        <div class="card-header">
          <span class="card-title">原文（版本A）</span>
        </div>
        <el-input
          v-model="textA"
          type="textarea"
          :rows="10"
          placeholder="请输入原文..."
        />
      </div>
      
      <div class="compare-action">
        <el-button type="primary" size="large" :icon="Switch" @click="doCompare" :loading="loading">
          开始比对
        </el-button>
        <el-button :icon="RefreshLeft" @click="clearAll">
          清空
        </el-button>
      </div>
      
      <div class="input-card">
        <div class="card-header">
          <span class="card-title">对比文本（版本B）</span>
        </div>
        <el-input
          v-model="textB"
          type="textarea"
          :rows="10"
          placeholder="请输入对比文本..."
        />
      </div>
    </div>
    
    <div v-if="compareResult" class="compare-result card">
      <div class="result-header">
        <h3>比对结果</h3>
        <div class="result-stats">
          <el-tag type="success" size="large">相似度: {{ similarity }}%</el-tag>
          <el-tag type="primary" size="large">差异数: {{ diffCount }}</el-tag>
        </div>
      </div>
      
      <div class="legend">
        <span class="legend-item">
          <span class="legend-color same"></span>
          <span>相同</span>
        </span>
        <span class="legend-item">
          <span class="legend-color inserted"></span>
          <span>新增</span>
        </span>
        <span class="legend-item">
          <span class="legend-color deleted"></span>
          <span>删除</span>
        </span>
      </div>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="diff-column">
            <div class="column-header">原文</div>
            <div class="diff-content">
              <span
                v-for="(part, idx) in diffPartsA"
                :key="'a-' + idx"
                :class="['diff-part', part.type]"
              >{{ part.text }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="diff-column">
            <div class="column-header">对比文本</div>
            <div class="diff-content">
              <span
                v-for="(part, idx) in diffPartsB"
                :key="'b-' + idx"
                :class="['diff-part', part.type]"
              >{{ part.text }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Switch, RefreshLeft } from '@element-plus/icons-vue'
import { compareTexts } from '../api/collation.js'

const textA = ref('')
const textB = ref('')
const loading = ref(false)
const compareResult = ref(null)

const similarity = computed(() => {
  if (!compareResult.value) return 0
  return (compareResult.value.similarity * 100).toFixed(1)
})

const diffCount = computed(() => {
  if (!compareResult.value) return 0
  return compareResult.value.diff_count || 0
})

const diffPartsA = computed(() => {
  if (!compareResult.value || !compareResult.value.diff_html) {
    return [{ text: textA.value, type: 'same' }]
  }
  return parseDiff(compareResult.value.diff_html.a || '')
})

const diffPartsB = computed(() => {
  if (!compareResult.value || !compareResult.value.diff_html) {
    return [{ text: textB.value, type: 'same' }]
  }
  return parseDiff(compareResult.value.diff_html.b || '')
})

function parseDiff(html) {
  const parts = []
  let remaining = html
  
  while (remaining.length > 0) {
    const insertIdx = remaining.indexOf('<ins>')
    const deleteIdx = remaining.indexOf('<del>')
    
    let nextIdx = -1
    let type = 'same'
    let tagLen = 0
    let closeTag = ''
    
    if (insertIdx >= 0 && (deleteIdx < 0 || insertIdx < deleteIdx)) {
      nextIdx = insertIdx
      type = 'inserted'
      tagLen = '<ins>'.length
      closeTag = '</ins>'
    } else if (deleteIdx >= 0) {
      nextIdx = deleteIdx
      type = 'deleted'
      tagLen = '<del>'.length
      closeTag = '</del>'
    }
    
    if (nextIdx < 0) {
      if (remaining.length > 0) {
        parts.push({ text: remaining, type: 'same' })
      }
      break
    }
    
    if (nextIdx > 0) {
      parts.push({ text: remaining.slice(0, nextIdx), type: 'same' })
    }
    
    const contentStart = nextIdx + tagLen
    const contentEnd = remaining.indexOf(closeTag, contentStart)
    
    if (contentEnd < 0) {
      parts.push({ text: remaining.slice(contentStart), type })
      break
    }
    
    parts.push({ text: remaining.slice(contentStart, contentEnd), type })
    remaining = remaining.slice(contentEnd + closeTag.length)
  }
  
  return parts
}

async function doCompare() {
  if (!textA.value.trim() || !textB.value.trim()) {
    ElMessage.warning('请输入两段文本进行比对')
    return
  }
  loading.value = true
  try {
    const res = await compareTexts({
      text_a: textA.value,
      text_b: textB.value
    })
    compareResult.value = res
    ElMessage.success('比对完成')
  } catch (e) {
    console.error('Compare error:', e)
    ElMessage.error('比对失败')
  } finally {
    loading.value = false
  }
}

function clearAll() {
  textA.value = ''
  textB.value = ''
  compareResult.value = null
}
</script>

<style lang="scss" scoped>
.compare-page {
  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 24px;
      color: #5D4037;
      margin: 0 0 8px 0;
    }
    
    .page-desc {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }
  
  .compare-inputs {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: flex-start;
    
    .input-card {
      flex: 1;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
      padding: 16px;
      
      .card-header {
        margin-bottom: 12px;
        
        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #5D4037;
        }
      }
    }
    
    .compare-action {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 40px;
    }
  }
  
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    padding: 20px;
  }
  
  .compare-result {
    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0ebe3;
      
      h3 {
        font-size: 18px;
        color: #5D4037;
        margin: 0;
      }
      
      .result-stats {
        display: flex;
        gap: 10px;
      }
    }
    
    .legend {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #666;
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          
          &.same {
            background: #f5f0e8;
          }
          
          &.inserted {
            background: #f0f9eb;
          }
          
          &.deleted {
            background: #fef0f0;
          }
        }
      }
    }
    
    .diff-column {
      border: 1px solid #e8e0d5;
      border-radius: 6px;
      overflow: hidden;
      
      .column-header {
        background: #faf6f0;
        padding: 10px 12px;
        font-size: 14px;
        font-weight: 600;
        color: #5D4037;
        border-bottom: 1px solid #e8e0d5;
      }
      
      .diff-content {
        padding: 12px;
        font-size: 14px;
        line-height: 1.8;
        min-height: 200px;
        white-space: pre-wrap;
        word-break: break-all;
        
        .diff-part {
          &.same {
            color: #333;
          }
          
          &.inserted {
            background: #f0f9eb;
            color: #67c23a;
            text-decoration: underline;
          }
          
          &.deleted {
            background: #fef0f0;
            color: #f56c6c;
            text-decoration: line-through;
          }
        }
      }
    }
  }
}
</style>
