<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleClick"
    >
      <v-layer ref="gridLayer">
        <v-rect :config="bgConfig" />
      </v-layer>

      <v-layer ref="mainLayer">
        <template v-for="element in store.visibleElements" :key="element.id">
          <DrawingTool
            v-if="['pencil', 'line', 'arrow', 'rect', 'circle'].includes(element.type)"
            :element="element"
            :selected="store.selectedIds.includes(element.id)"
            @select="handleElementSelect"
            @transform="handleTransform"
          />
          <TextTool
            v-else-if="element.type === 'text'"
            :element="element"
            :selected="store.selectedIds.includes(element.id)"
            @select="handleElementSelect"
            @transform="handleTransform"
          />
          <ImageTool
            v-else-if="element.type === 'image'"
            :element="element"
            :selected="store.selectedIds.includes(element.id)"
            @select="handleElementSelect"
            @transform="handleTransform"
          />
          <StickyNoteTool
            v-else-if="element.type === 'sticky'"
            :element="element"
            :selected="store.selectedIds.includes(element.id)"
            @select="handleElementSelect"
            @transform="handleTransform"
          />
        </template>
      </v-layer>

      <slot></slot>
    </v-stage>

    <div class="zoom-controls">
      <el-button circle size="small" @click="zoomIn">
        <el-icon><ZoomIn /></el-icon>
      </el-button>
      <div class="zoom-label">{{ Math.round(store.scale * 100) }}%</div>
      <el-button circle size="small" @click="zoomOut">
        <el-icon><ZoomOut /></el-icon>
      </el-button>
      <el-button circle size="small" @click="resetView">
        <el-icon><FullScreen /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import { useWhiteboardStore } from '../../stores/whiteboard'
import DrawingTool from './DrawingTool.vue'
import TextTool from './TextTool.vue'
import ImageTool from './ImageTool.vue'
import StickyNoteTool from './StickyNoteTool.vue'

const emit = defineEmits(['element-add', 'element-update', 'element-delete', 'cursor-move', 'save-elements'])
const instance = getCurrentInstance()

const store = useWhiteboardStore()
const wrapperRef = ref(null)
const stageRef = ref(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const viewStart = ref({ x: 0, y: 0 })
const isDrawing = ref(false)
const drawingElement = ref(null)
const lastPointerPos = ref({ x: 0, y: 0 })

const stageWidth = computed(() => wrapperRef.value?.clientWidth || window.innerWidth)
const stageHeight = computed(() => wrapperRef.value?.clientHeight || window.innerHeight)

const stageConfig = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value,
  scaleX: store.scale,
  scaleY: store.scale,
  x: store.x,
  y: store.y,
  draggable: store.tool === 'select' && store.selectedIds.length === 0
}))

const bgConfig = computed(() => ({
  x: -10000,
  y: -10000,
  width: 20000,
  height: 20000,
  fill: '#ffffff',
  listening: false
}))

const getStagePointer = () => {
  const stage = stageRef.value?.getStage?.() || instance?.refs?.stageRef?.getStage?.()
  if (!stage) return { x: 0, y: 0 }
  return stage.getPointerPosition() || { x: 0, y: 0 }
}

const toWorldCoords = (screenX, screenY) => {
  return {
    x: (screenX - store.x) / store.scale,
    y: (screenY - store.y) / store.scale
  }
}

const handleWheel = (e) => {
  e.evt.preventDefault()
  const stage = stageRef.value?.getStage?.() || instance?.refs?.stageRef?.getStage?.()
  if (!stage) return

  const oldScale = store.scale
  const pointer = stage.getPointerPosition() || { x: stageWidth.value / 2, y: stageHeight.value / 2 }

  const mousePointTo = {
    x: (pointer.x - store.x) / oldScale,
    y: (pointer.y - store.y) / oldScale
  }

  const delta = e.evt.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.1, Math.min(5, oldScale + delta))

  store.setScale(newScale)
  store.setPosition(
    pointer.x - mousePointTo.x * newScale,
    pointer.y - mousePointTo.y * newScale
  )
}

const handleMouseDown = (e) => {
  const stage = stageRef.value?.getStage?.() || instance?.refs?.stageRef?.getStage?.()
  if (!stage) return

  const clickedOnEmpty = e.target === stage || e.target === stage.find('Layer')[0] || e.target?.className === 'Rect'

  if (store.tool === 'select') {
    if (clickedOnEmpty) {
      store.clearSelection()
    }
    return
  }

  const pos = toWorldCoords(stage.getPointerPosition()?.x || 0, stage.getPointerPosition()?.y || 0)
  startDrawing(pos)
}

const handleMouseMove = (e) => {
  const stage = stageRef.value?.getStage?.() || instance?.refs?.stageRef?.getStage?.()
  if (!stage) return

  const pos = toWorldCoords(stage.getPointerPosition()?.x || 0, stage.getPointerPosition()?.y || 0)
  lastPointerPos.value = pos

  emit('cursor-move', pos.x, pos.y)

  if (isDrawing.value && drawingElement.value) {
    continueDrawing(pos)
  }
}

const handleMouseUp = () => {
  if (isDrawing.value && drawingElement.value) {
    finishDrawing()
  }
  isDrawing.value = false
  drawingElement.value = null
}

const handleClick = (e) => {
  const stage = stageRef.value?.getStage?.() || instance?.refs?.stageRef?.getStage?.()
  if (!stage) return

  const clickedOnEmpty = e.target === stage || e.target === stage.find('Layer')[0] || e.target?.className === 'Rect'

  if (store.tool === 'text' && clickedOnEmpty) {
    const pos = toWorldCoords(stage.getPointerPosition()?.x || 0, stage.getPointerPosition()?.y || 0)
    const el = store.addElement({
      type: 'text',
      x: pos.x,
      y: pos.y,
      text: '双击编辑文字',
      fontSize: store.fontSize,
      fontFamily: store.fontFamily,
      fill: store.color,
      width: 200,
      rotation: 0,
      draggable: true
    })
    emit('element-add', el)
    store.setTool('select')
  }

  if (store.tool === 'sticky' && clickedOnEmpty) {
    const pos = toWorldCoords(stage.getPointerPosition()?.x || 0, stage.getPointerPosition()?.y || 0)
    const el = store.addElement({
      type: 'sticky',
      x: pos.x,
      y: pos.y,
      width: 200,
      height: 180,
      text: '便签内容',
      fontSize: 14,
      fill: store.stickyNoteColor,
      textColor: '#000000',
      rotation: 0,
      draggable: true
    })
    emit('element-add', el)
    store.setTool('select')
  }
}

const startDrawing = (pos) => {
  isDrawing.value = true

  let newElement = null

  switch (store.tool) {
    case 'pencil':
      newElement = {
        type: 'pencil',
        points: [pos.x, pos.y],
        stroke: store.color,
        strokeWidth: store.strokeWidth,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
        x: 0,
        y: 0,
        rotation: 0,
        draggable: true
      }
      break
    case 'line':
    case 'arrow':
      newElement = {
        type: store.tool,
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: store.color,
        strokeWidth: store.strokeWidth,
        x: 0,
        y: 0,
        rotation: 0,
        draggable: true
      }
      break
    case 'rect':
      newElement = {
        type: 'rect',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: store.color,
        strokeWidth: store.strokeWidth,
        fill: 'transparent',
        rotation: 0,
        draggable: true
      }
      break
    case 'circle':
      newElement = {
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radiusX: 0,
        radiusY: 0,
        stroke: store.color,
        strokeWidth: store.strokeWidth,
        fill: 'transparent',
        rotation: 0,
        draggable: true
      }
      break
  }

  if (newElement) {
    const el = store.addElement(newElement)
    drawingElement.value = el
  }
}

const continueDrawing = (pos) => {
  if (!drawingElement.value) return

  const el = drawingElement.value

  switch (el.type) {
    case 'pencil': {
      const newPoints = [...el.points, pos.x, pos.y]
      store.updateElementLocal(el.id, { points: newPoints })
      break
    }
    case 'line':
    case 'arrow': {
      const newPoints = [el.points[0], el.points[1], pos.x, pos.y]
      store.updateElementLocal(el.id, { points: newPoints })
      break
    }
    case 'rect': {
      const startX = el.x
      const startY = el.y
      const newX = Math.min(startX, pos.x)
      const newY = Math.min(startY, pos.y)
      const newWidth = Math.abs(pos.x - startX)
      const newHeight = Math.abs(pos.y - startY)
      store.updateElementLocal(el.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      })
      break
    }
    case 'circle': {
      const startX = el.x
      const startY = el.y
      const radiusX = Math.abs(pos.x - startX) / 2
      const radiusY = Math.abs(pos.y - startY) / 2
      store.updateElementLocal(el.id, {
        x: Math.min(startX, pos.x) + radiusX,
        y: Math.min(startY, pos.y) + radiusY,
        radiusX,
        radiusY
      })
      break
    }
  }
}

const finishDrawing = () => {
  if (!drawingElement.value) return

  const el = store.elements.find(e => e.id === drawingElement.value.id)
  if (!el) return

  let valid = true
  switch (el.type) {
    case 'pencil':
      valid = el.points && el.points.length >= 4
      break
    case 'line':
    case 'arrow':
      valid = Math.abs(el.points[2] - el.points[0]) > 1 || Math.abs(el.points[3] - el.points[1]) > 1
      break
    case 'rect':
      valid = el.width > 1 && el.height > 1
      break
    case 'circle':
      valid = el.radiusX > 1 && el.radiusY > 1
      break
  }

  if (!valid) {
    store.elements = store.elements.filter(e => e.id !== el.id)
  } else {
    store.saveHistory()
    emit('element-add', el)
  }
}

const handleElementSelect = (id, e) => {
  store.selectElement(id, e?.evt?.shiftKey)
}

const handleTransform = (id, updates) => {
  store.updateElement(id, updates)
  emit('element-update', id, updates)
}

const zoomIn = () => {
  const newScale = Math.min(5, store.scale + 0.1)
  const centerX = stageWidth.value / 2
  const centerY = stageHeight.value / 2
  adjustScaleAround(newScale, centerX, centerY)
}

const zoomOut = () => {
  const newScale = Math.max(0.1, store.scale - 0.1)
  const centerX = stageWidth.value / 2
  const centerY = stageHeight.value / 2
  adjustScaleAround(newScale, centerX, centerY)
}

const adjustScaleAround = (newScale, screenX, screenY) => {
  const oldScale = store.scale
  const mousePointTo = {
    x: (screenX - store.x) / oldScale,
    y: (screenY - store.y) / oldScale
  }
  store.setScale(newScale)
  store.setPosition(
    screenX - mousePointTo.x * newScale,
    screenY - mousePointTo.y * newScale
  )
}

const resetView = () => {
  store.setScale(1)
  store.setPosition(0, 0)
}

watch(() => store.elements, () => {
  emit('save-elements')
}, { deep: true })

onMounted(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (store.selectedIds.length > 0) {
        e.preventDefault()
        store.selectedIds.forEach(id => {
          emit('element-delete', id)
        })
        store.deleteSelected()
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        store.redo()
      } else {
        store.undo()
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault()
      store.redo()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #f0f2f5;
  background-image:
    radial-gradient(circle, #dcdfe6 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: hidden;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 100;
  background-color: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.zoom-label {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
}
</style>
