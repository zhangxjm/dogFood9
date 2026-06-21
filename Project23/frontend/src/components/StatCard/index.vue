<template>
  <div class="stat-card">
    <div class="stat-icon" :style="{ background: bgColor }">
      <el-icon :size="28" :color="iconColor">
        <component :is="icon" />
      </el-icon>
    </div>
    <div class="stat-content">
      <div class="stat-title">{{ title }}</div>
      <div class="stat-value">{{ value }}</div>
      <div class="stat-sub" v-if="subText">
        <span :class="subTrend">{{ subText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: 'DataAnalysis'
  },
  bgColor: {
    type: String,
    default: '#ecf5ff'
  },
  iconColor: {
    type: String,
    default: '#409EFF'
  },
  subText: {
    type: String,
    default: ''
  },
  subTrend: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-sub {
  margin-top: 6px;
  font-size: 12px;
}

.stat-sub .up {
  color: #f56c6c;
}

.stat-sub .down {
  color: #67c23a;
}
</style>
