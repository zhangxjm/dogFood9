<template>
  <v-image
    ref="imageRef"
    :config="imageConfig"
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

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import Konva from 'konva'

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
const imageRef = ref(null)
const konvaImage = ref(null)
const imageObj = ref(null)

const loadImage = () => {
  if (!props.element.src) return

  const img = new (window.Image || Image)()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    imageObj.value = img
    konvaImage.value = new Konva.Image({
      image: img
    })
  }
  img.src = props.element.src
}

const imageConfig = computed(() => ({
  id: props.element.id,
  x: props.element.x || 0,
  y: props.element.y || 0,
  width: props.element.width || 100,
  height: props.element.height || 100,
  rotation: props.element.rotation || 0,
  draggable: !props.element.locked,
  listening: !props.element.locked,
  image: konvaImage.value
}))

const transformerConfig = computed(() => ({
  rotateEnabled: true,
  enabledAnchors: [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right'
  ],
  keepRatio: true,
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width < 20 || newBox.height < 20) {
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

  emit('transform', props.element.id, {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    width: Math.max(20, node.width() * scaleX),
    height: Math.max(20, node.height() * scaleY)
  })
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

watch(() => props.element.src, () => {
  loadImage()
})

onMounted(() => {
  loadImage()
  if (props.selected) {
    nextTick(attachTransformer)
  }
})

onBeforeUnmount(() => {
  if (konvaImage.value) {
    konvaImage.value.destroy()
  }
})
</script>
