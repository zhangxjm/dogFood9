import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

export const useWhiteboardStore = defineStore('whiteboard', {
  state: () => ({
    whiteboardId: null,
    whiteboardName: '',
    elements: [],
    selectedIds: [],
    tool: 'select',
    color: '#000000',
    strokeWidth: 2,
    fontSize: 16,
    fontFamily: 'Arial',
    stickyNoteColor: '#ffeb3b',
    scale: 1,
    x: 0,
    y: 0,
    history: [],
    historyIndex: -1,
    remoteCursors: {},
    versions: [],
    isDrawing: false,
    currentShape: null,
    startPos: null
  }),
  getters: {
    selectedElements: (state) => {
      return state.elements.filter(el => state.selectedIds.includes(el.id))
    },
    visibleElements: (state) => {
      return state.elements.filter(el => el.visible !== false)
    },
    canUndo: (state) => state.historyIndex > 0,
    canRedo: (state) => state.historyIndex < state.history.length - 1
  },
  actions: {
    initWhiteboard(id, name, elements = []) {
      this.whiteboardId = id
      this.whiteboardName = name
      this.elements = elements
      this.selectedIds = []
      this.history = []
      this.historyIndex = -1
      this.saveHistory()
    },
    setTool(tool) {
      this.tool = tool
      this.selectedIds = []
    },
    setColor(color) {
      this.color = color
    },
    setStrokeWidth(width) {
      this.strokeWidth = width
    },
    setFontSize(size) {
      this.fontSize = size
    },
    setStickyNoteColor(color) {
      this.stickyNoteColor = color
    },
    setScale(scale) {
      this.scale = Math.max(0.1, Math.min(5, scale))
    },
    setPosition(x, y) {
      this.x = x
      this.y = y
    },
    selectElement(id, addToSelection = false) {
      if (addToSelection) {
        if (this.selectedIds.includes(id)) {
          this.selectedIds = this.selectedIds.filter(i => i !== id)
        } else {
          this.selectedIds.push(id)
        }
      } else {
        this.selectedIds = [id]
      }
    },
    clearSelection() {
      this.selectedIds = []
    },
    addElement(element) {
      const newElement = {
        id: nanoid(),
        ...element,
        visible: true,
        locked: false
      }
      this.elements.push(newElement)
      this.saveHistory()
      return newElement
    },
    updateElement(id, updates) {
      const index = this.elements.findIndex(el => el.id === id)
      if (index !== -1) {
        this.elements[index] = { ...this.elements[index], ...updates }
        this.saveHistory()
      }
    },
    updateElementLocal(id, updates) {
      const index = this.elements.findIndex(el => el.id === id)
      if (index !== -1) {
        this.elements[index] = { ...this.elements[index], ...updates }
      }
    },
    deleteElement(id) {
      this.elements = this.elements.filter(el => el.id !== id)
      this.selectedIds = this.selectedIds.filter(i => i !== id)
      this.saveHistory()
    },
    deleteSelected() {
      const ids = [...this.selectedIds]
      ids.forEach(id => {
        this.elements = this.elements.filter(el => el.id !== id)
      })
      this.selectedIds = []
      this.saveHistory()
    },
    moveLayerUp(id) {
      const index = this.elements.findIndex(el => el.id === id)
      if (index < this.elements.length - 1) {
        const temp = this.elements[index]
        this.elements[index] = this.elements[index + 1]
        this.elements[index + 1] = temp
        this.saveHistory()
      }
    },
    moveLayerDown(id) {
      const index = this.elements.findIndex(el => el.id === id)
      if (index > 0) {
        const temp = this.elements[index]
        this.elements[index] = this.elements[index - 1]
        this.elements[index - 1] = temp
        this.saveHistory()
      }
    },
    moveLayerToTop(id) {
      const element = this.elements.find(el => el.id === id)
      if (element) {
        this.elements = this.elements.filter(el => el.id !== id)
        this.elements.push(element)
        this.saveHistory()
      }
    },
    moveLayerToBottom(id) {
      const element = this.elements.find(el => el.id === id)
      if (element) {
        this.elements = this.elements.filter(el => el.id !== id)
        this.elements.unshift(element)
        this.saveHistory()
      }
    },
    toggleVisibility(id) {
      const element = this.elements.find(el => el.id === id)
      if (element) {
        element.visible = !element.visible
        this.saveHistory()
      }
    },
    toggleLock(id) {
      const element = this.elements.find(el => el.id === id)
      if (element) {
        element.locked = !element.locked
        this.saveHistory()
      }
    },
    saveHistory() {
      const snapshot = JSON.stringify(this.elements)
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1)
      }
      this.history.push(snapshot)
      if (this.history.length > 50) {
        this.history.shift()
      }
      this.historyIndex = this.history.length - 1
    },
    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--
        this.elements = JSON.parse(this.history[this.historyIndex])
        this.selectedIds = []
      }
    },
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++
        this.elements = JSON.parse(this.history[this.historyIndex])
        this.selectedIds = []
      }
    },
    setElements(elements) {
      this.elements = elements
      this.saveHistory()
    },
    setRemoteCursor(userId, cursor) {
      if (cursor) {
        this.remoteCursors[userId] = cursor
      } else {
        delete this.remoteCursors[userId]
      }
    },
    setVersions(versions) {
      this.versions = versions
    },
    clearWhiteboard() {
      this.whiteboardId = null
      this.whiteboardName = ''
      this.elements = []
      this.selectedIds = []
      this.history = []
      this.historyIndex = -1
      this.remoteCursors = {}
      this.versions = []
      this.scale = 1
      this.x = 0
      this.y = 0
    }
  }
})
