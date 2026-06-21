<template>
  <div class="layer-panel">
    <div class="panel-header">
      <span class="panel-title">图层面板</span>
      <el-button link @click="$emit('close', false)">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <div class="layer-list">
      <el-empty v-if="store.elements.length === 0" description="暂无图层" :image-size="60" />
      <div
        v-for="(element, index) in [...store.elements].reverse()"
        :key="element.id"
        class="layer-item"
        :class="{ selected: store.selectedIds.includes(element.id), locked: element.locked }"
        @click="selectLayer(element.id)"
      >
        <div class="layer-icon">
          <el-icon size="16">
            <component :is="getTypeIcon(element.type)" />
          </el-icon>
        </div>
        <div class="layer-info">
          <span class="layer-name">{{ getLayerName(element, index) }}</span>
          <span class="layer-type">{{ getTypeName(element.type) }}</span>
        </div>
        <div class="layer-actions">
          <el-button
            link
            size="small"
            :title="element.visible ? '隐藏' : '显示'"
            @click.stop="toggleVisibility(element.id)"
          >
            <el-icon>
              <component :is="element.visible ? 'View' : 'Hide'" />
            </el-icon>
          </el-button>
          <el-button
            link
            size="small"
            :title="element.locked ? '解锁' : '锁定'"
            @click.stop="toggleLock(element.id)"
          >
            <el-icon>
              <component :is="element.locked ? 'Lock' : 'Unlock'" />
            </el-icon>
          </el-button>
          <el-dropdown @command="(cmd) => handleLayerCommand(cmd, element.id)" trigger="click">
            <el-button link size="small" title="更多操作">
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="up">上移一层</el-dropdown-item>
                <el-dropdown-item command="down">下移一层</el-dropdown-item>
                <el-dropdown-item command="top">置顶</el-dropdown-item>
                <el-dropdown-item command="bottom">置底</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWhiteboardStore } from '../../stores/whiteboard'

const emit = defineEmits(['close', 'layer-changed', 'element-delete'])

const store = useWhiteboardStore()

const getTypeIcon = (type) => {
  const icons = {
    pencil: 'Edit',
    line: 'Minus',
    arrow: 'Right',
    rect: 'Grid',
    circle: 'Circle',
    text: 'Document',
    image: 'Picture',
    sticky: 'CollectionTag'
  }
  return icons[type] || 'Circle'
}

const getTypeName = (type) => {
  const names = {
    pencil: '铅笔',
    line: '直线',
    arrow: '箭头',
    rect: '矩形',
    circle: '圆形',
    text: '文字',
    image: '图片',
    sticky: '便签'
  }
  return names[type] || type
}

const getLayerName = (element, index) => {
  if (element.type === 'text' && element.text) {
    const text = element.text.substring(0, 10)
    return text || `图层 ${index + 1}`
  }
  if (element.type === 'sticky' && element.text) {
    const text = element.text.substring(0, 10)
    return text || `图层 ${index + 1}`
  }
  return `图层 ${store.elements.length - index}`
}

const selectLayer = (id) => {
  store.selectElement(id, false)
}

const toggleVisibility = (id) => {
  store.toggleVisibility(id)
  emit('layer-changed')
}

const toggleLock = (id) => {
  store.toggleLock(id)
  emit('layer-changed')
}

const handleLayerCommand = (cmd, id) => {
  switch (cmd) {
    case 'up':
      store.moveLayerUp(id)
      emit('layer-changed')
      break
    case 'down':
      store.moveLayerDown(id)
      emit('layer-changed')
      break
    case 'top':
      store.moveLayerToTop(id)
      emit('layer-changed')
      break
    case 'bottom':
      store.moveLayerToBottom(id)
      emit('layer-changed')
      break
    case 'delete':
      emit('element-delete', id)
      break
  }
}
</script>

<style scoped>
.layer-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background-color: #fff;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 5px;
  border: 1px solid transparent;
}

.layer-item:hover {
  background-color: #f5f7fa;
}

.layer-item.selected {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.layer-item.locked {
  opacity: 0.6;
}

.layer-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  border-radius: 4px;
  color: #606266;
  flex-shrink: 0;
}

.layer-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.layer-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-type {
  font-size: 11px;
  color: #909399;
}

.layer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
</style>
