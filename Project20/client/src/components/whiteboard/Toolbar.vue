<template>
  <div class="toolbar-container">
    <div class="tool-group">
      <el-tooltip content="选择" placement="bottom">
        <el-button :type="store.tool === 'select' ? 'primary' : 'default'" @click="setTool('select')">
          <el-icon><Pointer /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <el-divider direction="vertical" />

    <div class="tool-group">
      <el-tooltip content="铅笔" placement="bottom">
        <el-button :type="store.tool === 'pencil' ? 'primary' : 'default'" @click="setTool('pencil')">
          <el-icon><Edit /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="直线" placement="bottom">
        <el-button :type="store.tool === 'line' ? 'primary' : 'default'" @click="setTool('line')">
          <el-icon><Minus /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="箭头" placement="bottom">
        <el-button :type="store.tool === 'arrow' ? 'primary' : 'default'" @click="setTool('arrow')">
          <el-icon><Right /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="矩形" placement="bottom">
        <el-button :type="store.tool === 'rect' ? 'primary' : 'default'" @click="setTool('rect')">
          <el-icon><Grid /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="圆形" placement="bottom">
        <el-button :type="store.tool === 'circle' ? 'primary' : 'default'" @click="setTool('circle')">
          <el-icon><CirclePlus /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <el-divider direction="vertical" />

    <div class="tool-group">
      <el-tooltip content="文字" placement="bottom">
        <el-button :type="store.tool === 'text' ? 'primary' : 'default'" @click="setTool('text')">
          <el-icon><Document /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="图片" placement="bottom">
        <el-button :type="store.tool === 'image' ? 'primary' : 'default'" @click="triggerImageUpload">
          <el-icon><Picture /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="便签" placement="bottom">
        <el-button :type="store.tool === 'sticky' ? 'primary' : 'default'" @click="setTool('sticky')">
          <el-icon><CollectionTag /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <el-divider direction="vertical" />

    <div class="tool-group">
      <el-tooltip content="颜色" placement="bottom">
        <el-color-picker v-model="colorTemp" @change="setColor" size="small" />
      </el-tooltip>
      <el-tooltip content="线条粗细" placement="bottom">
        <el-select v-model="strokeWidthTemp" size="small" style="width: 80px" @change="setStrokeWidth">
          <el-option :value="1" label="1px" />
          <el-option :value="2" label="2px" />
          <el-option :value="4" label="4px" />
          <el-option :value="6" label="6px" />
          <el-option :value="8" label="8px" />
        </el-select>
      </el-tooltip>
    </div>

    <el-divider direction="vertical" />

    <div class="tool-group">
      <el-tooltip content="撤销" placement="bottom">
        <el-button :disabled="!store.canUndo" @click="undo">
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="重做" placement="bottom">
        <el-button :disabled="!store.canRedo" @click="redo">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="删除选中" placement="bottom">
        <el-button type="danger" :disabled="store.selectedIds.length === 0" @click="deleteSelected">
          <el-icon><Delete /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageUpload"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useWhiteboardStore } from '../../stores/whiteboard'

const store = useWhiteboardStore()
const imageInput = ref(null)

const colorTemp = ref(store.color)
const strokeWidthTemp = ref(store.strokeWidth)

watch(() => store.color, (val) => { colorTemp.value = val })
watch(() => store.strokeWidth, (val) => { strokeWidthTemp.value = val })

const setTool = (tool) => {
  store.setTool(tool)
}

const setColor = (color) => {
  store.setColor(color)
}

const setStrokeWidth = (width) => {
  store.setStrokeWidth(width)
}

const undo = () => {
  store.undo()
}

const redo = () => {
  store.redo()
}

const deleteSelected = () => {
  store.deleteSelected()
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    const img = new Image()
    img.onload = () => {
      const maxSize = 400
      let width = img.width
      let height = img.height
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = width * ratio
        height = height * ratio
      }
      store.addElement({
        type: 'image',
        x: 100,
        y: 100,
        width,
        height,
        src: event.target.result,
        rotation: 0,
        draggable: true
      })
    }
    img.src = event.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}
</script>

<style scoped>
.toolbar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
