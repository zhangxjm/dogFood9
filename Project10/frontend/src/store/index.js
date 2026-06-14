import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentBook: null,
    currentPage: null,
    annotationList: [],
    searchHistory: []
  },
  mutations: {
    SET_CURRENT_BOOK(state, book) {
      state.currentBook = book
    },
    SET_CURRENT_PAGE(state, page) {
      state.currentPage = page
    },
    SET_ANNOTATIONS(state, annotations) {
      state.annotationList = annotations
    },
    ADD_ANNOTATION(state, annotation) {
      state.annotationList.push(annotation)
    },
    UPDATE_ANNOTATION(state, annotation) {
      const index = state.annotationList.findIndex(a => a.id === annotation.id)
      if (index !== -1) {
        Vue.set(state.annotationList, index, annotation)
      }
    },
    DELETE_ANNOTATION(state, annotationId) {
      state.annotationList = state.annotationList.filter(a => a.id !== annotationId)
    },
    ADD_SEARCH_HISTORY(state, keyword) {
      const list = state.searchHistory.filter(k => k !== keyword)
      list.unshift(keyword)
      state.searchHistory = list.slice(0, 10)
    }
  },
  actions: {
    setCurrentBook({ commit }, book) {
      commit('SET_CURRENT_BOOK', book)
    },
    setCurrentPage({ commit }, page) {
      commit('SET_CURRENT_PAGE', page)
    },
    setAnnotations({ commit }, annotations) {
      commit('SET_ANNOTATIONS', annotations)
    },
    addAnnotation({ commit }, annotation) {
      commit('ADD_ANNOTATION', annotation)
    },
    updateAnnotation({ commit }, annotation) {
      commit('UPDATE_ANNOTATION', annotation)
    },
    deleteAnnotation({ commit }, annotationId) {
      commit('DELETE_ANNOTATION', annotationId)
    }
  },
  getters: {
    currentBook: state => state.currentBook,
    currentPage: state => state.currentPage,
    annotationList: state => state.annotationList,
    searchHistory: state => state.searchHistory
  }
})
