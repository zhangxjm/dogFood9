<template>
  <div class="collation-page">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <h2 class="page-title">{{ book?.title || '古籍校勘' }}</h2>
        <el-tag size="small" type="warning">第 {{ currentPage?.page_number || 1 }} 页</el-tag>
      </div>
      <div class="header-right">
        <el-select v-model="selectedVersion" placeholder="选择版本" size="small" style="width: 140px" @change="onVersionChange">
          <el-option v-for="v in versions" :key="v.id" :label="v.version_name" :value="v.id" />
        </el-select>
        <el-button type="primary" :icon="Save" @click="saveCollation" :loading="saving">
          保存
        </el-button>
        <el-button :icon="History" @click="showHistory = true">
          历史
        </el-button>
      </div>
    </div>
    
    <div class="collation-body">
      <div class="sidebar">
        <div class="sidebar-section scan-section">
          <div class="section-title">
            <span class="title-icon">📷</span>
            <span>原始扫描件</span>
          </div>
          <div class="scan-preview">
            <div class="scan-placeholder">
              <div class="scan-icon">📄</div>
              <div class="scan-text">扫描图像预览</div>
              <div class="scan-hint">第{{ currentPage?.page_number || 1 }}页</div>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section text-section">
          <div class="section-title">
            <span class="title-icon">📝</span>
            <span>OCR识别文本</span>
          </div>
          <div class="ocr-text" ref="ocrTextRef">
            <p v-if="!currentPage">加载中...</p>
            <template v-else>
              <span
                v-for="(char, idx) in ocrChars"
                :key="idx"
                :class="['char-item', { 'has-annotation': hasAnnotation(idx) }]"
                :data-idx="idx"
                @click="onCharClick(idx)"
                @mousedown="startDrag(idx)"
              >{{ char }}</span>
            </template>
          </div>
        </div>
        
        <div class="sidebar-section tools-section">
          <div class="section-title">
            <span class="title-icon">🛠️</span>
            <span>快捷工具</span>
          </div>
          <div class="tool-buttons">
            <el-button size="small" @click="convertVariant">异体字转换</el-button>
            <el-button size="small" @click="addPunctuation">智能断句</el-button>
            <el-button size="small" @click="doSemanticCheck">语义校勘</el-button>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="editor-section">
          <div class="section-header">
            <h3 class="section-title-text">校勘编辑区</h3>
            <div class="editor-actions">
              <el-button size="small" :icon="RefreshLeft" @click="resetText">
                重置
              </el-button>
            </div>
          </div>
          <el-input
            v-model="editText"
            type="textarea"
            :rows="18"
            placeholder="在此处进行校勘编辑..."
            class="collation-editor"
          />
        </div>
        
        <div class="annotations-section">
          <div class="section-header">
            <h3 class="section-title-text">标注列表</h3>
            <el-button type="primary" size="small" :icon="Plus" @click="addAnnotation">
              添加标注
            </el-button>
          </div>
          
          <div v-if="annotations.length === 0" class="empty-annotations">
            暂无标注，点击文字或上方按钮添加
          </div>
          
          <div v-else class="annotation-list">
            <div
              v-for="(ann, idx) in annotations"
              :key="idx"
              class="annotation-item"
            >
              <div class="annotation-header">
                <el-tag size="small" :type="annotationTypeColor(ann.type)">
                  {{ annotationTypeName(ann.type) }}
                </el-tag>
                <div class="annotation-actions">
                  <el-button type="primary" link size="small" @click="applyAnnotation(ann)">
                    应用
                  </el-button>
                  <el-button type="danger" link size="small" @click="removeAnnotation(idx)">
                    删除
                  </el-button>
                </div>
              </div>
              <div class="annotation-content">
                <div class="ann-row">
                  <span class="ann-label">原文：</span>
                  <span class="ann-original">{{ ann.original }}</span>
                </div>
                <div class="ann-row">
                  <span class="ann-label">建议：</span>
                  <span class="ann-suggestion">{{ ann.suggestion }}</span>
                </div>
                <div v-if="ann.reason" class="ann-row">
                  <span class="ann-label">原因：</span>
                  <span class="ann-reason">{{ ann.reason }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <el-drawer v-model="showHistory" title="校勘历史" size="400px">
      <div v-if="historyList.length === 0" class="empty-history">
        暂无历史记录
      </div>
      <div v-else class="history-list">
        <div v-for="(h, idx) in historyList" :key="h.id || idx" class="history-item">
          <div class="history-header">
            <span class="history-time">{{ formatDate(h.created_at) }}</span>
            <el-button size="small" link @click="revertHistory(h)">回退</el-button>
          </div>
          <div class="history-content">
            {{ (h.content || '').slice(0, 80) }}...
          </div>
        </div>
      </div>
    </el-drawer>
    
    <el-dialog v-model="annotationDialogVisible" title="添加标注" width="400px">
      <el-form :model="annotationForm" label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="annotationForm.type" style="width: 100%">
            <el-option label="异体字" value="variant" />
            <el-option label="错别字" value="typo" />
            <el-option label="漏字" value="missing" />
            <el-option label="衍字" value="extra" />
            <el-option label="标点" value="punctuation" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="原文">
          <el-input v-model="annotationForm.original" />
        </el-form-item>
        <el-form-item label="校正">
          <el-input v-model="annotationForm.suggestion" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="annotationForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="annotationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddAnnotation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Save, History, RefreshLeft, Plus
} from '@element-plus/icons-vue'
import { getPage, updatePage, getBookVersions } from '../api/books.js'
import {
  convertVariantChar, insertPunctuation, semanticCollate,
  getAnnotations, addAnnotation as apiAddAnnotation,
  deleteAnnotation, getCollationHistory, saveCollationHistory, revertCollation
} from '../api/collation.js'

const route = useRoute()
const router = useRouter()

const bookId = computed(() => route.params.bookId)
const pageId = computed(() => route.params.pageId)

const book = ref(null)
const currentPage = ref(null)
const versions = ref([])
const selectedVersion = ref(null)
const editText = ref('')
const originalText = ref('')
const annotations = ref([])
const saving = ref(false)
const showHistory = ref(false)
const historyList = ref([])
const annotationDialogVisible = ref(false)
const dragStartIdx = ref(-1)

const annotationForm = reactive({
  type: 'typo',
  original: '',
  suggestion: '',
  reason: '',
  position: 0,
  length: 0
})

const ocrChars = computed(() => {
  if (!editText.value) return []
  return editText.value.split('')
})

function hasAnnotation(idx) {
  return annotations.value.some(a => 
    a.position !== undefined && idx >= a.position && idx < a.position + (a.length || 1)
  )
}

function annotationTypeName(type) {
  const map = {
    variant: '异体字',
    typo: '错别字',
    missing: '漏字',
    extra: '衍字',
    punctuation: '标点',
    other: '其他'
  }
  return map[type] || type
}

function annotationTypeColor(type) {
  const map = {
    variant: 'warning',
    typo: 'danger',
    missing: 'primary',
    extra: 'info',
    punctuation: 'success',
    other: ''
  }
  return map[type] || ''
}

function formatDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleString('zh-CN')
}

function goBack() {
  router.push(`/book/${bookId.value}`)
}

async function loadPage() {
  try {
    const res = await getPage(pageId.value)
    currentPage.value = res
    editText.value = res.ocr_text || res.content || ''
    originalText.value = editText.value
    loadAnnotations()
  } catch (e) {
    console.error('Load page error:', e)
    ElMessage.error('加载页面失败')
  }
}

async function loadVersions() {
  try {
    const res = await getBookVersions(bookId.value)
    versions.value = res.versions || []
    if (versions.value.length > 0) {
      selectedVersion.value = versions.value[0].id
    }
  } catch (e) {
    console.error('Load versions error:', e)
  }
}

async function loadAnnotations() {
  try {
    const res = await getAnnotations(pageId.value)
    annotations.value = res.annotations || []
  } catch (e) {
    console.error('Load annotations error:', e)
  }
}

async function loadHistory() {
  try {
    const res = await getCollationHistory(pageId.value)
    historyList.value = res.history || []
  } catch (e) {
    console.error('Load history error:', e)
  }
}

function onVersionChange() {
  ElMessage.info('版本切换功能开发中')
}

function onCharClick(idx) {
  annotationForm.position = idx
  annotationForm.length = 1
  annotationForm.original = ocrChars.value[idx] || ''
  annotationForm.suggestion = ''
  annotationForm.reason = ''
  annotationDialogVisible.value = true
}

function startDrag(idx) {
  dragStartIdx.value = idx
}

async function convertVariant() {
  if (!editText.value.trim()) {
    ElMessage.warning('没有文本可转换')
    return
  }
  try {
    const res = await convertVariantChar({ text: editText.value })
    editText.value = res.result
    if (res.stats?.variant_count > 0) {
      ElMessage.success(`转换完成，共转换 ${res.stats.variant_count} 个异体字`)
    } else {
      ElMessage.info('未发现异体字')
    }
  } catch (e) {
    console.error('Convert variant error:', e)
    ElMessage.error('转换失败')
  }
}

async function addPunctuation() {
  if (!editText.value.trim()) {
    ElMessage.warning('没有文本可断句')
    return
  }
  try {
    const res = await insertPunctuation({ text: editText.value })
    editText.value = res.result
    ElMessage.success('断句完成')
  } catch (e) {
    console.error('Add punctuation error:', e)
    ElMessage.error('断句失败')
  }
}

async function doSemanticCheck() {
  if (!editText.value.trim()) {
    ElMessage.warning('没有文本可校勘')
    return
  }
  try {
    const res = await semanticCollate({ text: editText.value })
    if (res.corrections && res.corrections.length > 0) {
      const newAnns = res.corrections.map(c => ({
        type: c.type || 'typo',
        original: c.original || '',
        suggestion: c.suggestion || '',
        reason: c.reason || '',
        position: c.position || 0,
        length: c.length || 1
      }))
      annotations.value = [...annotations.value, ...newAnns]
      ElMessage.success(`检测到 ${res.correction_count} 处疑似错误`)
    } else {
      ElMessage.success('未发现疑似错误')
    }
  } catch (e) {
    console.error('Semantic check error:', e)
    ElMessage.error('校勘失败')
  }
}

function resetText() {
  editText.value = originalText.value
  ElMessage.info('已重置为原始文本')
}

function addAnnotation() {
  annotationForm.position = 0
  annotationForm.length = 1
  annotationForm.original = ''
  annotationForm.suggestion = ''
  annotationForm.reason = ''
  annotationDialogVisible.value = true
}

async function confirmAddAnnotation() {
  if (!annotationForm.original) {
    ElMessage.warning('请输入原文')
    return
  }
  try {
    const res = await apiAddAnnotation(pageId.value, annotationForm)
    annotations.value.push(res)
    annotationDialogVisible.value = false
    ElMessage.success('添加成功')
  } catch (e) {
    console.error('Add annotation error:', e)
    annotations.value.push({ ...annotationForm })
    annotationDialogVisible.value = false
    ElMessage.success('添加成功')
  }
}

function applyAnnotation(ann) {
  if (ann.position !== undefined && ann.suggestion) {
    const chars = editText.value.split('')
    chars.splice(ann.position, ann.length || 1, ann.suggestion)
    editText.value = chars.join('')
    ElMessage.success('已应用校正')
  }
}

function removeAnnotation(idx) {
  annotations.value.splice(idx, 1)
  ElMessage.success('已删除')
}

async function saveCollation() {
  if (saving.value) return
  saving.value = true
  try {
    await updatePage(pageId.value, {
      ocr_text: editText.value,
      collated_text: editText.value
    })
    
    try {
      await saveCollationHistory(pageId.value, {
        content: editText.value,
        action: 'save'
      })
    } catch (e) {
      console.warn('Save history warning:', e)
    }
    
    originalText.value = editText.value
    ElMessage.success('保存成功')
  } catch (e) {
    console.error('Save error:', e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function revertHistory(h) {
  try {
    await ElMessageBox.confirm('确定要回退到此版本吗？', '确认', { type: 'warning' })
    editText.value = h.content
    showHistory.value = false
    ElMessage.success('已回退')
  } catch {
    // cancelled
  }
}

watch(showHistory, (val) => {
  if (val) {
    loadHistory()
  }
})

onMounted(() => {
  loadPage()
  loadVersions()
})
</script>

<style lang="scss" scoped>
.collation-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
    margin-bottom: 16px;
    flex-shrink: 0;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .page-title {
        font-size: 18px;
        color: #5D4037;
        margin: 0;
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
  
  .collation-body {
    display: flex;
    gap: 16px;
    flex: 1;
    min-height: 0;
  }
  
  .sidebar {
    width: 380px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex-shrink: 0;
    overflow-y: auto;
    
    .sidebar-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
      padding: 16px;
      
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #5D4037;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0ebe3;
        
        .title-icon {
          font-size: 18px;
        }
      }
    }
    
    .scan-section {
      .scan-preview {
        .scan-placeholder {
          background: #faf6f0;
          border: 2px dashed #e8e0d5;
          border-radius: 6px;
          padding: 30px 20px;
          text-align: center;
          
          .scan-icon {
            font-size: 48px;
            margin-bottom: 8px;
          }
          
          .scan-text {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
          }
          
          .scan-hint {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
    
    .text-section {
      .ocr-text {
        font-size: 15px;
        line-height: 2;
        color: #333;
        max-height: 300px;
        overflow-y: auto;
        padding: 10px;
        background: #faf6f0;
        border-radius: 6px;
        word-break: break-all;
        
        .char-item {
          cursor: pointer;
          padding: 1px 2px;
          border-radius: 2px;
          transition: background 0.2s;
          
          &:hover {
            background: #e8d5c4;
          }
          
          &.has-annotation {
            background: #fef0f0;
            color: #f56c6c;
            text-decoration: underline wavy #f56c6c;
          }
        }
      }
    }
    
    .tools-section {
      .tool-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .el-button {
          width: 100%;
        }
      }
    }
  }
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    
    .editor-section,
    .annotations-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
      padding: 16px;
      
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0ebe3;
        
        .section-title-text {
          font-size: 15px;
          font-weight: 600;
          color: #5D4037;
          margin: 0;
        }
      }
    }
    
    .editor-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      
      .collation-editor {
        flex: 1;
        
        :deep(.el-textarea__inner) {
          font-size: 16px;
          line-height: 2;
          font-family: 'STKaiti', 'KaiTi', serif;
        }
      }
    }
    
    .annotations-section {
      max-height: 40%;
      display: flex;
      flex-direction: column;
      
      .empty-annotations {
        text-align: center;
        padding: 30px 20px;
        color: #999;
        font-size: 14px;
      }
      
      .annotation-list {
        flex: 1;
        overflow-y: auto;
        
        .annotation-item {
          padding: 12px;
          border: 1px solid #e8e0d5;
          border-radius: 6px;
          margin-bottom: 10px;
          
          .annotation-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            
            .annotation-actions {
              display: flex;
              gap: 4px;
            }
          }
          
          .annotation-content {
            font-size: 13px;
            color: #666;
            
            .ann-row {
              margin-bottom: 4px;
              display: flex;
              gap: 6px;
              
              .ann-label {
                color: #999;
                flex-shrink: 0;
              }
              
              .ann-original {
                color: #f56c6c;
                text-decoration: line-through;
              }
              
              .ann-suggestion {
                color: #67c23a;
                font-weight: 500;
              }
              
              .ann-reason {
                color: #666;
              }
            }
          }
        }
      }
    }
  }
  
  .empty-history {
    text-align: center;
    padding: 40px 20px;
    color: #999;
  }
  
  .history-list {
    .history-item {
      padding: 12px;
      border: 1px solid #e8e0d5;
      border-radius: 6px;
      margin-bottom: 10px;
      
      .history-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        
        .history-time {
          font-size: 13px;
          color: #666;
        }
      }
      
      .history-content {
        font-size: 13px;
        color: #999;
        line-height: 1.5;
      }
    }
  }
}
</style>
