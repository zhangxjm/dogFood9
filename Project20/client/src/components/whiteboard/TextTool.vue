<template>
  <v-text
    ref="textRef"
    :config="textConfig"
    @click="handleClick"
    @dblclick="handleDblClick"
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
const textRef = ref(null)

const textConfig = computed(() => ({
  id: props.element.id,
  x: props.element.x || 0,
  y: props.element.y || 0,
  text: props.element.text || '',
  fontSize: props.element.fontSize || 16,
  fontFamily: props.element.fontFamily || 'Arial',
  fill: props.element.fill || '#000000',
  width: props.element.width || 200,
  rotation: props.element.rotation || 0,
  draggable: !props.element.locked,
  listening: !props.element.locked,
  align: 'left'
}))

const transformerConfig = computed(() => ({
  rotateEnabled: true,
  enabledAnchors: [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'middle-left',
    'middle-right'
  ],
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width < 20) {
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

const handleDblClick = (e) => {
  e.cancelBubble = true
  const textNode = e.target
  const stage = textNode.getStage()
  if (!stage) return

  textNode.hide()

  const tr = stage.findOne('Transformer')
  if (tr) tr.hide()

  const textPosition = textNode.absolutePosition()
  const areaPosition = {
    x: stage.container().offsetLeft,
    y: stage.container().offsetTop
  }

  const textarea = document.createElement('textarea')
  document.body.appendChild(textarea)

  textarea.value = textNode.text()
  textarea.style.position = 'absolute'
  textarea.style.top = `${textPosition.y + areaPosition.y}px`
  textarea.style.left = `${textPosition.x + areaPosition.x}px`
  textarea.style.width = `${textNode.width() * textNode.scaleX()}px`
  textarea.style.height = `${textNode.height() * textNode.scaleY() + 10}px`
  textarea.style.lineHeight = textNode.lineHeight()
  textarea.style.fontSize = `${textNode.fontSize()}px`
  textarea.style.border = 'none'
  textarea.style.padding = '0px'
  textarea.style.margin = '0px'
  textarea.style.overflow = 'hidden'
  textarea.style.background = 'none'
  textarea.style.outline = 'none'
  textarea.style.resize = 'none'
  textarea.style.lineHeight = textNode.lineHeight()
  textarea.style.fontFamily = textNode.fontFamily()
  textarea.style.transformOrigin = 'left top'
  textarea.style.textAlign = textNode.align()
  textarea.style.color = textNode.fill()
  const rotation = textNode.rotation()
  let transform = ''
  if (rotation) {
    transform += `rotateZ(${rotation}deg)`
  }
  let px = 0
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  if (isFirefox) {
    px += 2 + Math.round(textNode.fontSize() / 20)
  }
  transform += `translateY(-${px}px)`

  textarea.style.transform = transform
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight + 3}px`

  textarea.focus()

  const removeTextarea = () => {
    const newText = textarea.value
    textarea.parentNode.removeChild(textarea)
    window.removeEventListener('click', handleOutsideClick)
    textNode.show()
    if (tr) tr.show()

    emit('transform', props.element.id, { text: newText })
  }

  const handleOutsideClick = (e) => {
    if (e.target !== textarea) {
      removeTextarea()
    }
  }

  setTimeout(() => {
    window.addEventListener('click', handleOutsideClick)
  })

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeTextarea()
    }
  })

  textarea.addEventListener('blur', removeTextarea)
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

  node.scaleX(1)
  node.scaleY(1)

  emit('transform', props.element.id, {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    width: Math.max(20, node.width() * scaleX),
    fontSize: Math.max(8, node.fontSize() * scaleX)
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

onMounted(() => {
  if (props.selected) {
    nextTick(attachTransformer)
  }
})
</script>
