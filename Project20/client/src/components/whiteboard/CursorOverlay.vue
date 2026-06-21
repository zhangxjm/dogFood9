<template>
  <v-layer>
    <template v-for="(cursor, userId) in store.remoteCursors" :key="userId">
      <v-group :config="{ x: cursor.x, y: cursor.y, listening: false }">
        <v-line
          :config="{
            points: [0, 0, 6, 20, 8, 8, 20, 6, 0, 0],
            fill: getCursorColor(userId),
            stroke: '#ffffff',
            strokeWidth: 1,
            listening: false,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 2
          }"
        />
        <v-rect
          :config="{
            x: 12,
            y: -8,
            width: nameWidths[userId] || 60,
            height: 20,
            fill: getCursorColor(userId),
            cornerRadius: 4,
            listening: false
          }"
        />
        <v-text
          :config="{
            x: 18,
            y: -5,
            text: cursor.username || '用户',
            fontSize: 12,
            fill: '#ffffff',
            listening: false,
            width: (nameWidths[userId] || 60) - 12,
            align: 'left'
          }"
          @before="measureText"
        />
      </v-group>
    </template>
  </v-layer>
</template>

<script setup>
import { reactive, watch, nextTick } from 'vue'
import { useWhiteboardStore } from '../../stores/whiteboard'

const store = useWhiteboardStore()

const nameWidths = reactive({})

const colors = [
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b'
]

const getCursorColor = (userId) => {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const measureText = (e) => {
  const node = e.target
  if (!node) return
  const text = node.text() || ''
  const width = Math.max(60, text.length * 12 + 18)
  nextTick(() => {
    const cursor = Object.entries(store.remoteCursors).find(
      ([, c]) => c.username === text
    )
    if (cursor) {
      nameWidths[cursor[0]] = width
    }
  })
}

watch(() => store.remoteCursors, (cursors) => {
  Object.entries(cursors).forEach(([userId, cursor]) => {
    if (!nameWidths[userId] && cursor.username) {
      nameWidths[userId] = Math.max(60, cursor.username.length * 12 + 18)
    }
  })
}, { immediate: true, deep: true })
</script>
