import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCollationStore = defineStore('collation', () => {
  const currentBook = ref(null)
  const currentPage = ref(null)
  const annotationList = ref([])
  const searchHistory = ref([])

  function setCurrentBook(book) {
    currentBook.value = book
  }

  function setCurrentPage(page) {
    currentPage.value = page
  }

  function setAnnotations(annotations) {
    annotationList.value = annotations
  }

  function addAnnotation(annotation) {
    annotationList.value.push(annotation)
  }

  function updateAnnotation(annotation) {
    const index = annotationList.value.findIndex(a => a.id === annotation.id)
    if (index !== -1) {
      annotationList.value[index] = annotation
    }
  }

  function deleteAnnotation(annotationId) {
    annotationList.value = annotationList.value.filter(a => a.id !== annotationId)
  }

  function addSearchHistory(keyword) {
    const list = searchHistory.value.filter(k => k !== keyword)
    list.unshift(keyword)
    searchHistory.value = list.slice(0, 10)
  }

  return {
    currentBook,
    currentPage,
    annotationList,
    searchHistory,
    setCurrentBook,
    setCurrentPage,
    setAnnotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addSearchHistory
  }
})
