<template>
  <template v-if="element.type === 'pencil'">
    <v-line
      :config="lineConfig"
      @click="handleClick"
      @dragend="handleDragEnd"
      @transformend="handleTransformEnd"
    />
    <v-transformer
      v-if="selected"
      ref="transformerRef"
      :config="transformerConfig"
      @transformend="handleTransformEnd"
    />
  </template>

  <template v-else-if="element.type === 'line'">
    <v-line
      :config="lineConfig"
      @click="handleClick"
      @dragend="handleDragEnd"
      @transformend="handleTransformEnd"
    />
    <v-transformer
      v-if="selected"
      ref="transformerRef"
      :config="transformerConfig"
      @transformend="handleTransformEnd"
    />
  </template>

  <template v-else-if="element.type === 'arrow'">
    <v-arrow
      :config="arrowConfig"
      @click="handleClick"
      @dragend="handleDragEnd"
      @transformend="handleTransformEnd"
    />
    <v-transformer
      v-if="selected"
      ref="transformerRef"
      :config="transformerConfig"
      @transformend="handleTransformEnd"
    />
  </template>

  <template v-else-if="element.type === 'rect'">
    <v-rect
      :config="rectConfig"
      @click="handleClick"
      @dragend="handleDragEnd"
      @transformend="handleTransformEnd"
    />
    <v-transformer
      v-if="selected"
      ref="transformerRef"
      :config="transformerConfig"
      @transformend="handleTransformEnd"
    />
  </template>

  <template v-else-if="element.type === 'circle'">
    <v-ellipse
      :config="circleConfig"
      @click="handleClick"
      @dragend="handleDragEnd"
      @transformend="handleTransformEnd"
    />
    <v-transformer
      v-if="selected"
      ref="transformerRef"
      :config="transformerConfig"
      @transformend="handleTransformEnd"
    />
  </template>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, getCurrentInstance } from 'vue'

const props = defineProps({
  element: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'transform'])

const instance = getCurrentInstance()
const transformerRef = ref(null)

const baseConfig = computed(() => ({
  id: props.element.id,
  x: props.element.x || 0,
  y: props.element.y || 0,
  rotation: props.element.rotation || 0,
  draggable: !props.element.locked,
  listening: !props.element.locked,
  hitStrokeWidth: 10
}))

const lineConfig = computed(() => ({
  ...baseConfig.value,
  points: props.element.points || [],
  stroke: props.element.stroke || '#000000',
  strokeWidth: props.element.strokeWidth || 2,
  tension: props.element.tension || 0.5,
  lineCap: props.element.lineCap || 'round',
  lineJoin: props.element.lineJoin || 'round'
}))

const arrowConfig = computed(() => ({
  ...baseConfig.value,
  points: props.element.points || [],
  stroke: props.element.stroke || '#000000',
  strokeWidth: props.element.strokeWidth || 2,
  pointerLength: 10,
  pointerWidth: 10,
  fill: props.element.stroke || '#000000'
}))

const rectConfig = computed(() => ({
  ...baseConfig.value,
  width: props.element.width || 0,
  height: props.element.height || 0,
  stroke: props.element.stroke || '#000000',
  strokeWidth: props.element.strokeWidth || 2,
  fill: props.element.fill || 'transparent',
  cornerRadius: 0
}))

const circleConfig = computed(() => ({
  ...baseConfig.value,
  radiusX: props.element.radiusX || 0,
  radiusY: props.element.radiusY || 0,
  stroke: props.element.stroke || '#000000',
  strokeWidth: props.element.strokeWidth || 2,
  fill: props.element.fill || 'transparent'
}))

const transformerConfig = computed(() => ({
  rotateEnabled: true,
  enabledAnchors: [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'middle-left',
    'middle-right',
    'top-center',
    'bottom-center'
  ],
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width < 5 || newBox.height < 5) {
      return oldBox
    }
    return newBox
  }
}))

const handleClick = (e) => {
  e.cancelBubble = true
  emit('select', props.element.id, e)
  nextTick(attachTransformer)
}

const handleDragEnd = (e) => {
  const node = e.target
  emit('transform', props.element.id, {
    x: node.x(),
    y: node.y()
  })
}

const handleTransformEnd = (e) => {
  const node = e.target
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()

  node.scaleX(1)
  node.scaleY(1)

  let updates = {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation()
  }

  if (props.element.type === 'rect') {
    updates = {
      ...updates,
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY)
    }
  } else if (props.element.type === 'circle') {
    updates = {
      ...updates,
      radiusX: Math.max(5, (props.element.radiusX || 0) * scaleX),
      radiusY: Math.max(5, (props.element.radiusY || 0) * scaleY)
    }
  } else if (props.element.type === 'line' || props.element.type === 'arrow' || props.element.type === 'pencil') {
    const points = [...(props.element.points || [])]
    for (let i = 0; i < points.length; i += 2) {
      points[i] = points[i] * scaleX
      points[i + 1] = points[i + 1] * scaleY
    }
    updates.points = points
  }

  emit('transform', props.element.id, updates)
}

const attachTransformer = () => {
  const tr = transformerRef.value?.getStage?.() || instance?.refs?.transformerRef?.getNode?.()
  if (!tr) return

  const stage = tr.getStage()
  if (!stage) return

  const node = stage.findOne(`#${props.element.id}`)
  if (node) {
    tr.nodes([node])
    tr.getLayer().batchDraw()
  }
}

watch(() => props.selected, (val) => {
  if (val) {
    nextTick(attachTransformer)
  }
})

onMounted(() => {
  if (props.selected) {
    nextTick(attachTransformer)
  }
})
</script>
