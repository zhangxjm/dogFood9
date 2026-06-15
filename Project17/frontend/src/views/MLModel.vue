<template>
  <div class="ml-model-page">
    <div class="page-header">
      <h2 class="page-title">模型管理</h2>
      <el-button type="primary" @click="trainModel" :loading="training">
        <el-icon><Refresh /></el-icon>
        重新训练模型
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">当前活跃模型</h3>
          <div v-if="activeModel" class="model-info">
            <div class="model-header">
              <el-icon :size="48" color="#409eff"><Cpu /></el-icon>
              <div>
                <div class="model-name">{{ activeModel.model_name }}</div>
                <div class="model-version">版本: {{ activeModel.model_version }}</div>
              </div>
            </div>
            <div class="model-metrics">
              <div class="metric-item">
                <div class="metric-value">{{ (activeModel.accuracy * 100).toFixed(1) }}%</div>
                <div class="metric-label">准确率</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ (activeModel.precision * 100).toFixed(1) }}%</div>
                <div class="metric-label">精确率</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ (activeModel.recall * 100).toFixed(1) }}%</div>
                <div class="metric-label">召回率</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ (activeModel.f1_score * 100).toFixed(1) }}%</div>
                <div class="metric-label">F1分数</div>
              </div>
            </div>
            <div class="model-desc">
              <strong>模型描述:</strong> {{ activeModel.description }}
            </div>
          </div>
          <el-empty v-else description="暂无活跃模型" />
        </div>
      </el-col>

      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">特征重要性</h3>
          <v-chart class="chart" :option="featureImportanceOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <div class="chart-card">
          <h3 class="chart-title">模型版本历史</h3>
          <el-table :data="models" style="width: 100%;" v-loading="loading">
            <el-table-column prop="model_name" label="模型名称" width="220" />
            <el-table-column prop="model_version" label="版本号" width="120" />
            <el-table-column prop="model_type" label="算法类型" width="140" />
            <el-table-column label="准确率" width="120">
              <template #default="{ row }">
                {{ row.accuracy ? (row.accuracy * 100).toFixed(2) + '%' : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="精确率" width="120">
              <template #default="{ row }">
                {{ row.precision ? (row.precision * 100).toFixed(2) + '%' : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="召回率" width="120">
              <template #default="{ row }">
                {{ row.recall ? (row.recall * 100).toFixed(2) + '%' : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="F1分数" width="120">
              <template #default="{ row }">
                {{ row.f1_score ? (row.f1_score * 100).toFixed(2) + '%' : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="is_active" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                  {{ row.is_active ? '活跃' : '历史' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Cpu } from '@element-plus/icons-vue'
import * as mlApi from '@/api/ml'

const loading = ref(false)
const training = ref(false)
const models = ref([])
const activeModel = ref(null)
const featureImportance = ref([])

const featureImportanceOption = computed(() => {
  const features = featureImportance.value.map(item => item.feature).reverse()
  const values = featureImportance.value.map(item => item.importance).reverse()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 0.5
    },
    yAxis: {
      type: 'category',
      data: features
    },
    series: [
      {
        name: '重要性',
        type: 'bar',
        data: values,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#67c23a' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        }
      }
    ]
  }
})

const loadModels = async () => {
  loading.value = true
  try {
    const res = await mlApi.getMLModels()
    models.value = res
    activeModel.value = res.find(m => m.is_active) || null
  } catch (error) {
    console.error('Failed to load models:', error)
  } finally {
    loading.value = false
  }
}

const loadFeatureImportance = async () => {
  try {
    const res = await mlApi.getFeatureImportance()
    featureImportance.value = res.data
  } catch (error) {
    console.error('Failed to load feature importance:', error)
  }
}

const trainModel = async () => {
  training.value = true
  try {
    await mlApi.trainMLModel()
    ElMessage.success('模型训练成功')
    loadModels()
    loadFeatureImportance()
  } catch (error) {
    ElMessage.error('模型训练失败')
    console.error('Failed to train model:', error)
  } finally {
    training.value = false
  }
}

onMounted(() => {
  loadModels()
  loadFeatureImportance()
})
</script>

<style scoped>
.ml-model-page {
  padding: 0;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.chart {
  height: 300px;
}

.model-info {
  padding: 10px 0;
}

.model-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.model-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.model-version {
  font-size: 14px;
  color: #909399;
}

.model-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metric-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 13px;
  color: #909399;
}

.model-desc {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
</style>
