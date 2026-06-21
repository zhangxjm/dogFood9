<template>
  <v-group
    :config="groupConfig"
    @click="handleClick"
    @dragend="handleDragEnd"
    @transformend="handleTransformEnd"
  >
    <v-rect :config="rectConfig" />
    <v-text :config="textConfig" />
  </v-group>
  <v-transformer
    v-if="selected"
    ref="transformerRef"
    :config="transformerConfig"
    @transformend="handleTransformEnd"
  />
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, getCurrentInstance } from 'vue'

defineOptions({
  inheritAttrs: false
})

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

const groupConfig = computed(() => ({
  id: props.element.id,
  x: props.element.x || 0,
  y: props.element.y || 0,
  rotation: props.element.rotation || 0,
  draggable: !props.element.locked,
  listening: !props.element.locked
}))

const rectConfig = computed(() => ({
  width: props.element.width || 200,
  height: props.element.height || 180,
  fill: props.element.fill || '#ffeb3b',
  shadowColor: 'black',
  shadowBlur: 5,
  shadowOffset: { x: 3, y: 3 },
  shadowOpacity: 0.2,
  cornerRadius: 4
}))

const textConfig = computed(() => ({
  text: props.element.text || '',
  fontSize: props.element.fontSize || 14,
  fontFamily: 'Arial',
  fill: props.element.textColor || '#000000',
  width: (props.element.width || 200) - 20,
  x: 10,
  y: 10,
  align: 'left',
  listening: false
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
    if (newBox.width < 100 || newBox.height < 80) {
      return oldBox
    }
    return newBox
  }
}))

const handleClick = (e) => {
  e.cancelBubble = true
  emit('select', props.element.id, e)
  nextTick(attachTransformer)

  if (e.evt.detail === 2) {
    handleDblClick(e)
  }
}

const handleDblClick = (e) => {
  const group = e.target
  const stage = group.getStage()
  if (!stage) return

  group.hide()

  const tr = stage.findOne('Transformer')
  if (tr) tr.hide()

  const absPos = group.absolutePosition()
  const areaPosition = {
    x: stage.container().offsetLeft,
    y: stage.container().offsetTop
  }

  const textarea = document.createElement('textarea')
  document.body.appendChild(textarea)

  textarea.value = props.element.text || ''
  textarea.style.position = 'absolute'
  textarea.style.top = `${absPos.y + areaPosition.y + 10}px`
  textarea.style.left = `${absPos.x + areaPosition.x + 10}px`
  textarea.style.width = `${(props.element.width || 200) * group.scaleX() - 20}px`
  textarea.style.height = `${(props.element.height || 180) * group.scaleY() - 20}px`
  textarea.style.border = 'none'
  textarea.style.padding = '0px'
  textarea.style.margin = '0px'
  textarea.style.background = props.element.fill || '#ffeb3b'
  textarea.style.outline = 'none'
  textarea.style.resize = 'none'
  textarea.style.fontSize = `${props.element.fontSize || 14}px`
  textarea.style.fontFamily = 'Arial'
  textarea.style.color = props.element.textColor || '#000000'
  textarea.style.lineHeight = '1.5'
  textarea.style.borderRadius = '4px'

  textarea.focus()

  const removeTextarea = () => {
    const newText = textarea.value
    textarea.parentNode.removeChild(textarea)
    window.removeEventListener('click', handleOutsideClick)
    group.show()
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
  const scaleY = node.scaleY()

  node.scaleX(1)
  node.scaleY(1)

  emit('transform', props.element.id, {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    width: Math.max(100, (props.element.width || 200) * scaleX),
    height: Math.max(80, (props.element.height || 180) * scaleY)
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
